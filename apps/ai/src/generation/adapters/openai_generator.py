"""OpenAI-compatible generator adapter supporting direct OpenAI, Sumopod, and third-party proxies."""

import logging
import time
from typing import Any, Optional, Sequence

import openai
from openai import OpenAI

from src.generation.citation import DEFAULT_ABSTENTION_MESSAGE_ID, parse_citations
from src.generation.config import GenerationConfig
from src.generation.exceptions import GenerationAPIError, GenerationConfigError
from src.generation.interface import BaseGenerator, GenerationResult
from src.generation.prompt import build_grounded_messages
from src.retrieval.interface import RetrievalResult

logger = logging.getLogger(__name__)


class OpenAIGenerator(BaseGenerator):
    """Adapter for OpenAI Chat Completion protocol endpoints (including Sumopod)."""

    def __init__(
        self,
        config: GenerationConfig,
        client: Optional[Any] = None,
    ) -> None:
        self.config = config
        if client is not None:
            self._client = client
        else:
            if not config.api_key:
                raise GenerationConfigError(
                    "OpenAI API key must be provided or configured via LLM_API_KEY / OPENAI_API_KEY."
                )
            self._client = OpenAI(
                api_key=config.api_key,
                base_url=config.base_url,
                timeout=config.timeout_seconds,
            )

    def generate(
        self,
        query: str,
        context: Sequence[RetrievalResult],
    ) -> GenerationResult:
        """Synthesize a grounded answer with citations using OpenAI Chat Completion protocol."""
        if not query or not query.strip():
            raise ValueError("Query string must not be empty or whitespace.")

        # Immediate local abstention bypass if context is empty
        if not context:
            logger.info("Empty context provided to generator; abstaining immediately without API call.")
            return GenerationResult(
                query=query.strip(),
                answer=DEFAULT_ABSTENTION_MESSAGE_ID,
                citations=[],
                has_sufficient_context=False,
            )

        system_prompt, user_prompt = build_grounded_messages(query, context)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        attempt = 0
        backoff_delay = 0.5
        last_exception: Optional[Exception] = None

        while attempt <= self.config.max_retries:
            try:
                response = self._client.chat.completions.create(
                    model=self.config.model_name,
                    messages=messages,
                    temperature=self.config.temperature,
                    max_tokens=self.config.max_tokens,
                )
                raw_text = response.choices[0].message.content or ""
                clean_answer, citations, has_context = parse_citations(raw_text, context)

                return GenerationResult(
                    query=query.strip(),
                    answer=clean_answer,
                    citations=citations,
                    has_sufficient_context=has_context,
                )

            except (
                openai.RateLimitError,
                openai.APIConnectionError,
                openai.APITimeoutError,
                openai.InternalServerError,
            ) as transient_err:
                attempt += 1
                last_exception = transient_err
                if attempt <= self.config.max_retries:
                    logger.warning(
                        "Transient error encountered during OpenAI generation (attempt %d/%d): %s. Retrying in %.2fs...",
                        attempt,
                        self.config.max_retries,
                        transient_err,
                        backoff_delay,
                    )
                    time.sleep(backoff_delay)
                    backoff_delay *= 2.0
                else:
                    break
            except Exception as non_transient_err:
                status_code = getattr(non_transient_err, "status_code", None)
                raise GenerationAPIError(
                    f"OpenAI generation request failed: {non_transient_err}",
                    status_code=status_code,
                    original_error=non_transient_err,
                ) from non_transient_err

        status_code = getattr(last_exception, "status_code", None)
        raise GenerationAPIError(
            f"OpenAI generation request failed after {attempt} attempts: {last_exception}",
            status_code=status_code,
            original_error=last_exception,
        )

    def generate_stream(
        self,
        query: str,
        context: Sequence[RetrievalResult],
    ):
        """Stream generated text tokens using OpenAI Chat Completion protocol."""
        if not query or not query.strip():
            raise ValueError("Query string must not be empty or whitespace.")

        if not context:
            yield DEFAULT_ABSTENTION_MESSAGE_ID
            return

        system_prompt, user_prompt = build_grounded_messages(query, context)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        try:
            stream = self._client.chat.completions.create(
                model=self.config.model_name,
                messages=messages,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
                stream=True,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as err:
            status_code = getattr(err, "status_code", None)
            raise GenerationAPIError(
                f"OpenAI streaming failed: {err}",
                status_code=status_code,
                original_error=err,
            ) from err

