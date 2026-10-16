"""Redis Streams consumer and hybrid CV parser for asynchronous ATS resume processing."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import inspect
import json
import logging
import os
from pathlib import Path
import re
from typing import Any, Callable
import uuid

from src.ingestion.exceptions import (
    CorruptedDocumentError,
    EmptyDocumentError,
    UnsupportedFormatError,
)
from src.ingestion.service import DocumentIngestionService

logger = logging.getLogger("hris_ai_cv_worker")

STREAM_UPLOADED = "candidate.cv.uploaded"
STREAM_PARSED = "candidate.cv.parsed"
STREAM_FAILED = "candidate.cv.failed"
STREAM_DLQ = "candidate.cv.dlq"
CONSUMER_GROUP = "cv-parser"

KNOWN_SKILLS: tuple[str, ...] = (
    "Python",
    "C#",
    ".NET",
    "ASP.NET",
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "NestJS",
    "FastAPI",
    "PostgreSQL",
    "SQL",
    "Redis",
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Git",
    "CI/CD",
    "GraphQL",
    "REST",
    "Tailwind",
    "Prisma",
    "PyTorch",
    "Machine Learning",
    "RAG",
    "Go",
    "Java",
)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


async def _maybe_await(result: Any) -> Any:
    if inspect.isawaitable(result):
        return await result
    return result


class HybridCvParser:
    """Extracts structured candidate profile JSON from raw resume text using LLM with regex fallback."""

    def __init__(
        self,
        use_llm: bool = True,
        llm_extractor: Callable[[str], dict[str, Any]] | None = None,
    ) -> None:
        self.use_llm = use_llm
        self.llm_extractor = llm_extractor

    def parse(self, extracted_text: str) -> tuple[dict[str, Any], float]:
        text = (extracted_text or "").strip()
        if not text:
            return (
                {
                    "fullName": None,
                    "email": None,
                    "phone": None,
                    "skills": [],
                    "education": [],
                    "experience": [],
                    "summary": "",
                },
                0.0,
            )

        if self.llm_extractor is not None:
            try:
                llm_data = self.llm_extractor(text)
                return self._normalize_parsed_dict(llm_data, text), 0.92
            except Exception as err:
                logger.warning("Custom LLM CV extractor failed, using heuristic fallback: %s", err)

        api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
        if self.use_llm and api_key:
            try:
                llm_data = self._extract_via_openai(text, api_key)
                return self._normalize_parsed_dict(llm_data, text), 0.90
            except Exception as err:
                logger.warning("LLM CV extraction failed, falling back to deterministic parser: %s", err)

        return self._deterministic_parse(text)

    def _extract_via_openai(self, text: str, api_key: str) -> dict[str, Any]:
        from openai import OpenAI

        base_url = os.getenv("LLM_BASE_URL") or os.getenv("OPENAI_BASE_URL")
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=15.0)
        prompt = (
            "Extract candidate resume details into strict JSON with keys: "
            "fullName (string|null), email (string|null), phone (string|null), "
            "skills (array of strings), education (array of strings), "
            "experience (array of strings), summary (string).\n\n"
            f"Resume text:\n{text[:6000]}"
        )
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a precise HR resume parser that outputs only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=1024,
        )
        raw_content = (resp.choices[0].message.content or "").strip()
        json_match = re.search(r"\{.*\}", raw_content, re.DOTALL)
        if not json_match:
            raise ValueError("LLM response did not contain a JSON object.")
        return json.loads(json_match.group(0))

    def _deterministic_parse(self, text: str) -> tuple[dict[str, Any], float]:
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

        # 1. Email
        email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        email = email_match.group(0).lower() if email_match else None

        # 2. Phone
        phone_match = re.search(
            r"(?:\+?\d{1,3}[\s\-()]*)?(?:\d[\s\-()]*){8,14}\d",
            text,
        )
        phone = phone_match.group(0).strip() if phone_match else None

        # 3. Candidate Name (heuristic: first non-header line that isn't an email/phone/section title)
        full_name: str | None = None
        ignored_headers = {
            "curriculum vitae",
            "resume",
            "cv",
            "summary",
            "education",
            "experience",
            "skills",
            "work experience",
            "profile",
        }
        for line in lines[:5]:
            clean = re.sub(r"^(?:name|candidate)\s*:\s*", "", line, flags=re.IGNORECASE).strip()
            if (
                clean
                and clean.lower() not in ignored_headers
                and "@" not in clean
                and not re.search(r"\d{4,}", clean)
                and 2 <= len(clean.split()) <= 5
            ):
                full_name = clean
                break

        # 4. Skills
        found_skills: list[str] = []
        for skill in KNOWN_SKILLS:
            pattern = r"(?<![A-Za-z0-9])" + re.escape(skill) + r"(?![A-Za-z0-9])"
            if re.search(pattern, text, flags=re.IGNORECASE):
                found_skills.append(skill)

        # 5. Education
        edu_keywords = re.compile(
            r"\b(?:university|universitas|institut|bachelor|master|b\.?sc|m\.?sc|s\.?kom|s1|s2|degree|gpa|ipk|computer science|informatics|engineering)\b",
            re.IGNORECASE,
        )
        education = [ln for ln in lines if edu_keywords.search(ln)][:5]

        # 6. Experience
        exp_keywords = re.compile(
            r"\b(?:engineer|developer|architect|manager|lead|analyst|consultant|intern|specialist|director|20\d{2})\b",
            re.IGNORECASE,
        )
        experience = [
            ln
            for ln in lines
            if exp_keywords.search(ln) and ln not in education and ln != full_name
        ][:6]

        # 7. Summary
        summary = " ".join(lines[:4])[:280].strip()

        populated_signals = sum(
            1
            for item in (full_name, email, phone, found_skills, education, experience)
            if item
        )
        confidence = round(min(0.95, 0.45 + populated_signals * 0.08), 2)

        return (
            {
                "fullName": full_name,
                "email": email,
                "phone": phone,
                "skills": found_skills,
                "education": education,
                "experience": experience,
                "summary": summary,
            },
            confidence,
        )

    def _normalize_parsed_dict(self, data: dict[str, Any], raw_text: str) -> dict[str, Any]:
        fallback, _ = self._deterministic_parse(raw_text)
        return {
            "fullName": data.get("fullName") or fallback["fullName"],
            "email": data.get("email") or fallback["email"],
            "phone": data.get("phone") or fallback["phone"],
            "skills": list(data.get("skills") or fallback["skills"]),
            "education": list(data.get("education") or fallback["education"]),
            "experience": list(data.get("experience") or fallback["experience"]),
            "summary": str(data.get("summary") or fallback["summary"]),
        }


class CvStreamWorker:
    """Consumes `candidate.cv.uploaded` from Redis Streams, parses CVs, and emits parsed/failed/DLQ events."""

    def __init__(
        self,
        redis_client: Any | None = None,
        redis_url: str | None = None,
        storage_root: str | Path | None = None,
        ingestion_service: DocumentIngestionService | None = None,
        parser: HybridCvParser | None = None,
        consumer_name: str | None = None,
        max_attempts: int = 3,
    ) -> None:
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis = redis_client
        self.storage_root = Path(storage_root or os.getenv("CV_STORAGE_ROOT", "/cv-data")).resolve()
        self.ingestion_service = ingestion_service or DocumentIngestionService()
        self.parser = parser or HybridCvParser()
        self.consumer_name = consumer_name or f"ai-worker-{uuid.uuid4().hex[:8]}"
        self.max_attempts = max_attempts
        self._processed_docs: set[int] = set()
        self._attempts: dict[int, int] = {}
        self._stop_event = asyncio.Event()

    async def _get_redis(self) -> Any:
        if self._redis is None:
            import redis.asyncio as aioredis

            self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def ensure_consumer_group(self) -> None:
        r = await self._get_redis()
        try:
            await _maybe_await(
                r.xgroup_create(STREAM_UPLOADED, CONSUMER_GROUP, id="0", mkstream=True)
            )
        except Exception as err:
            if "BUSYGROUP" not in str(err):
                raise

    def stop(self) -> None:
        self._stop_event.set()

    async def run_forever(self, poll_interval_seconds: float = 1.0) -> None:
        """Main background loop with exponential backoff when Redis is unavailable."""
        backoff = 1.0
        while not self._stop_event.is_set():
            try:
                await self.ensure_consumer_group()
                r = await self._get_redis()
                backoff = 1.0

                entries = await _maybe_await(
                    r.xreadgroup(
                        groupname=CONSUMER_GROUP,
                        consumername=self.consumer_name,
                        streams={STREAM_UPLOADED: ">"},
                        count=10,
                        block=int(poll_interval_seconds * 1000),
                    )
                )
                if entries:
                    for _stream_name, messages in entries:
                        for msg_id, fields in messages:
                            await self.process_message(msg_id, fields)
                else:
                    await asyncio.sleep(poll_interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.warning("CvStreamWorker Redis poll error (retrying in %.1fs): %s", backoff, err)
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=backoff)
                except asyncio.TimeoutError:
                    pass
                backoff = min(backoff * 2.0, 30.0)

    async def process_message(self, msg_id: str, fields: dict[str, Any]) -> dict[str, Any]:
        """Process a single `candidate.cv.uploaded` stream entry with idempotency, retry, and DLQ."""
        r = await self._get_redis()
        envelope, data = self._unpack_fields(fields)

        application_id = int(data.get("applicationId") or envelope.get("entity_id") or 0)
        document_id = int(data.get("documentId") or 0)
        storage_path = str(data.get("storagePath") or "")
        correlation_id = str(envelope.get("correlation_id") or uuid.uuid4())
        causation_id = str(envelope.get("id") or msg_id)

        # 1. Idempotency check
        if await self._is_already_processed(r, document_id):
            await _maybe_await(r.xack(STREAM_UPLOADED, CONSUMER_GROUP, msg_id))
            return {
                "status": "duplicate",
                "applicationId": application_id,
                "documentId": document_id,
            }

        # 2. Increment delivery/attempt counter
        payload_attempt = int(data.get("attempt") or 0)
        tracked_attempt = await self._increment_attempt(r, document_id)
        attempt = max(payload_attempt, tracked_attempt)

        try:
            resolved_path = self._resolve_safe_path(storage_path)
            doc = self.ingestion_service.ingest_file(resolved_path, actor="cv-worker")
            parsed_dict, confidence = self.parser.parse(doc.content)
            parsed_json_str = json.dumps(parsed_dict, ensure_ascii=False)

            await self._mark_processed(r, document_id)
            out_envelope = self._build_envelope(
                event_type=STREAM_PARSED,
                entity_id=str(application_id),
                correlation_id=correlation_id,
                causation_id=causation_id,
                data={
                    "applicationId": application_id,
                    "documentId": document_id,
                    "parsedJson": parsed_json_str,
                    "extractedText": doc.content,
                    "confidence": confidence,
                },
            )
            await self._publish_envelope(r, STREAM_PARSED, out_envelope)
            await _maybe_await(r.xack(STREAM_UPLOADED, CONSUMER_GROUP, msg_id))

            return {
                "status": "parsed",
                "applicationId": application_id,
                "documentId": document_id,
                "confidence": confidence,
                "parsed": parsed_dict,
            }

        except (UnsupportedFormatError, EmptyDocumentError, CorruptedDocumentError, PermissionError) as perm_err:
            logger.warning(
                "Permanent CV parse failure for applicationId=%s documentId=%s: %s",
                application_id,
                document_id,
                perm_err,
            )
            fail_envelope = self._build_envelope(
                event_type=STREAM_FAILED,
                entity_id=str(application_id),
                correlation_id=correlation_id,
                causation_id=causation_id,
                data={
                    "applicationId": application_id,
                    "documentId": document_id,
                    "errorCode": "ERR_UNSUPPORTED_FILE",
                    "errorMessage": str(perm_err),
                    "attempt": attempt,
                },
            )
            if attempt >= self.max_attempts:
                await self._publish_envelope(r, STREAM_DLQ, fail_envelope)
            await self._publish_envelope(r, STREAM_FAILED, fail_envelope)
            await _maybe_await(r.xack(STREAM_UPLOADED, CONSUMER_GROUP, msg_id))
            return {
                "status": "failed",
                "errorCode": "ERR_UNSUPPORTED_FILE",
                "applicationId": application_id,
                "documentId": document_id,
                "attempt": attempt,
            }

        except Exception as transient_err:
            logger.warning(
                "Transient CV processing error (attempt %d/%d) for applicationId=%s documentId=%s: %s",
                attempt,
                self.max_attempts,
                application_id,
                document_id,
                transient_err,
            )
            if attempt >= self.max_attempts:
                dlq_envelope = self._build_envelope(
                    event_type=STREAM_DLQ,
                    entity_id=str(application_id),
                    correlation_id=correlation_id,
                    causation_id=causation_id,
                    data={
                        "applicationId": application_id,
                        "documentId": document_id,
                        "errorCode": "ERR_PARSE_FAILED",
                        "errorMessage": str(transient_err),
                        "attempt": attempt,
                    },
                )
                fail_envelope = self._build_envelope(
                    event_type=STREAM_FAILED,
                    entity_id=str(application_id),
                    correlation_id=correlation_id,
                    causation_id=causation_id,
                    data={
                        "applicationId": application_id,
                        "documentId": document_id,
                        "errorCode": "ERR_PARSE_FAILED",
                        "errorMessage": str(transient_err),
                        "attempt": attempt,
                    },
                )
                await self._publish_envelope(r, STREAM_DLQ, dlq_envelope)
                await self._publish_envelope(r, STREAM_FAILED, fail_envelope)
                await _maybe_await(r.xack(STREAM_UPLOADED, CONSUMER_GROUP, msg_id))
                return {
                    "status": "dlq",
                    "errorCode": "ERR_PARSE_FAILED",
                    "applicationId": application_id,
                    "documentId": document_id,
                    "attempt": attempt,
                }

            # Leave unacknowledged in PEL for retry < max_attempts
            return {
                "status": "retry",
                "applicationId": application_id,
                "documentId": document_id,
                "attempt": attempt,
            }

    def _resolve_safe_path(self, storage_path: str) -> Path:
        if not storage_path or not storage_path.strip():
            raise UnsupportedFormatError("Missing storagePath in event payload.")
        cleaned = storage_path.strip().lstrip("/\\")
        candidate_path = (self.storage_root / cleaned).resolve()
        if (
            candidate_path != self.storage_root
            and self.storage_root not in candidate_path.parents
        ):
            raise PermissionError(f"Path traversal blocked for storagePath '{storage_path}'.")
        return candidate_path

    async def _is_already_processed(self, r: Any, document_id: int) -> bool:
        if document_id <= 0:
            return False
        if document_id in self._processed_docs:
            return True
        if hasattr(r, "sismember"):
            try:
                in_redis = await _maybe_await(r.sismember("cv:parsed:docs", str(document_id)))
                if in_redis:
                    self._processed_docs.add(document_id)
                    return True
            except Exception:
                pass
        return False

    async def _mark_processed(self, r: Any, document_id: int) -> None:
        if document_id <= 0:
            return
        self._processed_docs.add(document_id)
        if hasattr(r, "sadd"):
            try:
                await _maybe_await(r.sadd("cv:parsed:docs", str(document_id)))
            except Exception:
                pass

    async def _increment_attempt(self, r: Any, document_id: int) -> int:
        self._attempts[document_id] = self._attempts.get(document_id, 0) + 1
        local_attempt = self._attempts[document_id]
        if document_id > 0 and hasattr(r, "hincrby"):
            try:
                redis_attempt = await _maybe_await(
                    r.hincrby("cv:attempts", str(document_id), 1)
                )
                return max(local_attempt, int(redis_attempt))
            except Exception:
                pass
        return local_attempt

    @staticmethod
    def _unpack_fields(fields: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
        normalized: dict[str, Any] = {}
        for k, v in fields.items():
            key = k.decode("utf-8") if isinstance(k, bytes) else str(k)
            val = v.decode("utf-8") if isinstance(v, bytes) else v
            normalized[key] = val

        envelope: dict[str, Any] = {}
        for env_key in ("envelope", "payload", "message"):
            if env_key in normalized and isinstance(normalized[env_key], str):
                try:
                    parsed_env = json.loads(normalized[env_key])
                    if isinstance(parsed_env, dict):
                        envelope = parsed_env
                        break
                except Exception:
                    pass

        if not envelope:
            envelope = dict(normalized)

        raw_data = envelope.get("data") or normalized.get("data")
        if isinstance(raw_data, str):
            try:
                data = json.loads(raw_data)
            except Exception:
                data = {}
        elif isinstance(raw_data, dict):
            data = dict(raw_data)
        else:
            data = dict(normalized)

        return envelope, data

    @staticmethod
    def _build_envelope(
        event_type: str,
        entity_id: str,
        correlation_id: str,
        causation_id: str,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "occurred_at": _utc_now_iso(),
            "tenant_id": "default",
            "entity_id": entity_id,
            "correlation_id": correlation_id,
            "causation_id": causation_id,
            "version": 1,
            "data": data,
        }

    @staticmethod
    async def _publish_envelope(r: Any, stream: str, envelope: dict[str, Any]) -> None:
        envelope_json = json.dumps(envelope, ensure_ascii=False)
        data_json = json.dumps(envelope.get("data", {}), ensure_ascii=False)
        await _maybe_await(
            r.xadd(
                stream,
                {
                    "id": str(envelope["id"]),
                    "type": str(envelope["type"]),
                    "occurred_at": str(envelope["occurred_at"]),
                    "tenant_id": str(envelope["tenant_id"]),
                    "entity_id": str(envelope["entity_id"]),
                    "correlation_id": str(envelope["correlation_id"]),
                    "causation_id": str(envelope["causation_id"]),
                    "version": str(envelope["version"]),
                    "data": data_json,
                    "envelope": envelope_json,
                },
            )
        )
