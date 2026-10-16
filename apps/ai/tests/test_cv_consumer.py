"""Unit tests for HybridCvParser and CvStreamWorker (Redis Streams consumer, idempotency, retry & DLQ)."""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any
import zipfile

import pytest
from pypdf import PdfWriter

from src.worker.cv_consumer import (
    CONSUMER_GROUP,
    STREAM_DLQ,
    STREAM_FAILED,
    STREAM_PARSED,
    STREAM_UPLOADED,
    CvStreamWorker,
    HybridCvParser,
)


class FakeRedisStreams:
    """In-memory fake Redis client supporting xadd, xack, xgroup_create, sismember, sadd, hincrby."""

    def __init__(self) -> None:
        self.streams: dict[str, list[tuple[str, dict[str, Any]]]] = {}
        self.acked: list[tuple[str, str, str]] = []
        self.sets: dict[str, set[str]] = {}
        self.hashes: dict[str, dict[str, int]] = {}
        self._seq = 0

    async def xgroup_create(self, name: str, groupname: str, id: str = "0", mkstream: bool = True) -> bool:
        if mkstream and name not in self.streams:
            self.streams[name] = []
        return True

    async def xadd(self, stream: str, fields: dict[str, Any]) -> str:
        self._seq += 1
        msg_id = f"{self._seq}-0"
        self.streams.setdefault(stream, []).append((msg_id, dict(fields)))
        return msg_id

    async def xack(self, stream: str, group: str, msg_id: str) -> int:
        self.acked.append((stream, group, msg_id))
        return 1

    async def sismember(self, key: str, member: str) -> bool:
        return member in self.sets.get(key, set())

    async def sadd(self, key: str, member: str) -> int:
        s = self.sets.setdefault(key, set())
        before = len(s)
        s.add(member)
        return 1 if len(s) > before else 0

    async def hincrby(self, key: str, field: str, amount: int = 1) -> int:
        h = self.hashes.setdefault(key, {})
        h[field] = h.get(field, 0) + amount
        return h[field]


def _write_docx(path: Path, lines: list[str]) -> None:
    buf = io.BytesIO()
    p_xml = "".join(f"<w:p><w:r><w:t>{ln}</w:t></w:r></w:p>" for ln in lines)
    xml_doc = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{p_xml}</w:body></w:document>"
    )
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("word/document.xml", xml_doc.encode("utf-8"))
    path.write_bytes(buf.getvalue())


def test_hybrid_cv_parser_deterministic_extraction(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    parser = HybridCvParser(use_llm=False)
    sample_cv = """
    Rizky Pratama
    Email: rizky.pratama@tech.id | Phone: +62 811-2233-4455
    Senior Full-Stack Engineer (2021 - 2026)
    Built enterprise microservices using C#, .NET, TypeScript, React, Next.js, PostgreSQL, Redis, and Docker.
    Bachelor of Computer Science (S1), Institut Teknologi Bandung — GPA 3.90
    """
    parsed, confidence = parser.parse(sample_cv)

    assert parsed["fullName"] == "Rizky Pratama"
    assert parsed["email"] == "rizky.pratama@tech.id"
    assert "+62 811-2233-4455" in (parsed["phone"] or "")
    assert "C#" in parsed["skills"]
    assert "React" in parsed["skills"]
    assert "PostgreSQL" in parsed["skills"]
    assert any("Institut Teknologi Bandung" in edu for edu in parsed["education"])
    assert any("Senior Full-Stack Engineer" in exp for exp in parsed["experience"])
    assert confidence >= 0.75


import asyncio


def test_cv_stream_worker_processes_valid_cv_and_is_idempotent(tmp_path: Path) -> None:
    async def _run() -> None:
        cv_rel_path = "1/42/resume.docx"
        full_cv_path = tmp_path / cv_rel_path
        full_cv_path.parent.mkdir(parents=True, exist_ok=True)
        _write_docx(
            full_cv_path,
            [
                "Dewi Lestari",
                "dewi.lestari@anglerfish.id",
                "+6281299887766",
                "Lead AI Engineer working with Python, FastAPI, PyTorch, and Redis.",
                "Master of Computer Science, Universitas Gadjah Mada",
            ],
        )

        fake_redis = FakeRedisStreams()
        worker = CvStreamWorker(
            redis_client=fake_redis,
            storage_root=tmp_path,
            parser=HybridCvParser(use_llm=False),
        )

        incoming_envelope = {
            "id": "evt-upload-1",
            "type": STREAM_UPLOADED,
            "tenant_id": "default",
            "entity_id": "42",
            "correlation_id": "corr-123",
            "version": 1,
            "data": {
                "applicationId": 42,
                "documentId": 77,
                "storagePath": cv_rel_path,
                "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
        }

        res1 = await worker.process_message(
            "100-0",
            {"envelope": json.dumps(incoming_envelope)},
        )
        assert res1["status"] == "parsed"
        assert res1["applicationId"] == 42
        assert res1["documentId"] == 77
        assert (STREAM_UPLOADED, CONSUMER_GROUP, "100-0") in fake_redis.acked
        assert len(fake_redis.streams.get(STREAM_PARSED, [])) == 1

        _, emitted_fields = fake_redis.streams[STREAM_PARSED][0]
        emitted_envelope = json.loads(emitted_fields["envelope"])
        assert emitted_envelope["type"] == STREAM_PARSED
        assert emitted_envelope["causation_id"] == "evt-upload-1"
        assert emitted_envelope["data"]["applicationId"] == 42
        assert emitted_envelope["data"]["documentId"] == 77
        parsed_json = json.loads(emitted_envelope["data"]["parsedJson"])
        assert parsed_json["email"] == "dewi.lestari@anglerfish.id"
        assert "Python" in parsed_json["skills"]

        # Duplicate delivery of same documentId must be skipped idempotently and XACKed
        res2 = await worker.process_message(
            "101-0",
            {"envelope": json.dumps(incoming_envelope)},
        )
        assert res2["status"] == "duplicate"
        assert len(fake_redis.streams.get(STREAM_PARSED, [])) == 1
        assert (STREAM_UPLOADED, CONSUMER_GROUP, "101-0") in fake_redis.acked

    asyncio.run(_run())


def test_cv_stream_worker_retries_and_routes_to_dlq_after_3_attempts(tmp_path: Path) -> None:
    async def _run() -> None:
        fake_redis = FakeRedisStreams()
        worker = CvStreamWorker(
            redis_client=fake_redis,
            storage_root=tmp_path,
            parser=HybridCvParser(use_llm=False),
            max_attempts=3,
        )

        # Point to a missing file to simulate transient shared-volume delay / IO error
        missing_payload = {
            "envelope": json.dumps(
                {
                    "id": "evt-missing-1",
                    "type": STREAM_UPLOADED,
                    "entity_id": "55",
                    "data": {
                        "applicationId": 55,
                        "documentId": 88,
                        "storagePath": "1/55/missing.pdf",
                    },
                }
            )
        }

        r1 = await worker.process_message("201-0", missing_payload)
        assert r1["status"] == "retry"
        assert r1["attempt"] == 1
        assert len(fake_redis.acked) == 0

        r2 = await worker.process_message("201-0", missing_payload)
        assert r2["status"] == "retry"
        assert r2["attempt"] == 2
        assert len(fake_redis.acked) == 0

        r3 = await worker.process_message("201-0", missing_payload)
        assert r3["status"] == "dlq"
        assert r3["attempt"] == 3
        assert (STREAM_UPLOADED, CONSUMER_GROUP, "201-0") in fake_redis.acked
        assert len(fake_redis.streams.get(STREAM_DLQ, [])) == 1
        assert len(fake_redis.streams.get(STREAM_FAILED, [])) == 1

    asyncio.run(_run())


def test_cv_stream_worker_emits_failed_on_blank_unreadable_pdf(tmp_path: Path) -> None:
    async def _run() -> None:
        blank_rel = "1/99/blank.pdf"
        blank_file = tmp_path / blank_rel
        blank_file.parent.mkdir(parents=True, exist_ok=True)
        writer = PdfWriter()
        writer.add_blank_page(width=612, height=792)
        buf = io.BytesIO()
        writer.write(buf)
        blank_file.write_bytes(buf.getvalue())

        fake_redis = FakeRedisStreams()
        worker = CvStreamWorker(
            redis_client=fake_redis,
            storage_root=tmp_path,
            parser=HybridCvParser(use_llm=False),
        )

        res = await worker.process_message(
            "300-0",
            {
                "envelope": json.dumps(
                    {
                        "id": "evt-blank-1",
                        "type": STREAM_UPLOADED,
                        "entity_id": "99",
                        "data": {
                            "applicationId": 99,
                            "documentId": 990,
                            "storagePath": blank_rel,
                        },
                    }
                )
            },
        )
        assert res["status"] == "failed"
        assert res["errorCode"] == "ERR_UNSUPPORTED_FILE"
        assert len(fake_redis.streams.get(STREAM_FAILED, [])) == 1
        assert (STREAM_UPLOADED, CONSUMER_GROUP, "300-0") in fake_redis.acked

    asyncio.run(_run())
