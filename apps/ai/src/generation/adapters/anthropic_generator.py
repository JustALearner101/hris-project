"""Anthropic-compatible generator adapter supporting direct Anthropic, Sumopod, and third-party proxies."""

import logging
import time
from typing import Any, Optional, Sequence

import anthropic
from anthropic import Anthropic

from src.generation.citation import DEFAULT_ABSTENTION_MESSAGE_ID, parse_citations
from src.generation.config import GenerationConfig
from src.generation.exceptions import GenerationAPIError, GenerationConfigError
from src.generation.interface import BaseGenerator, GenerationResult
from src.generation.prompt import build_grounded_messages
from src.retrieval.interface import RetrievalResult

logger = logging.getLogger(__name__)


class AnthropicGenerator(BaseGenerator):
    """Adapter for Anthropic Messages protocol endpoints (including Sumopod)."""

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
                    "Anthropic API key must be provided or configured via LLM_API_KEY / ANTHROPIC_API_KEY."
                )
            self._client = Anthropic(
                api_key=config.api_key,
                base_url=config.base_url,
                timeout=config.timeout_seconds,
            )

    def generate(
        self,
        query: str,
        context: Sequence[RetrievalResult],
    ) -> GenerationResult:
        """Synthesize a grounded answer with citations using Anthropic Messages protocol."""
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
            {"role": "user", "content": user_prompt},
        ]

        attempt = 0
        backoff_delay = 0.5
        last_exception: Optional[Exception] = None

        while attempt <= self.config.max_retries:
            try:
                response = self._client.messages.create(
                    model=self.config.model_name,
                    system=system_prompt,
                    messages=messages,
                    temperature=self.config.temperature,
                    max_tokens=self.config.max_tokens,
                )
                # Anthropic content blocks
                raw_text = ""
                if hasattr(response, "content") and response.content:
                    raw_text = response.content[0].text or ""

                clean_answer, citations, has_context = parse_citations(raw_text, context)

                return GenerationResult(
                    query=query.strip(),
                    answer=clean_answer,
                    citations=citations,
                    has_sufficient_context=has_context,
                )

            except (
                anthropic.RateLimitError,
                anthropic.APIConnectionError,
                anthropic.APITimeoutError,
                anthropic.InternalServerError,
            ) as transient_err:
                attempt += 1
                last_exception = transient_err
                if attempt <= self.config.max_retries:
                    logger.warning(
                        "Transient error encountered during Anthropic generation (attempt %d/%d): %s. Retrying in %.2fs...",
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
                    f"Anthropic generation request failed: {non_transient_err}",
                    status_code=status_code,
                    original_error=non_transient_err,
                ) from non_transient_err

        status_code = getattr(last_exception, "status_code", None)
        raise GenerationAPIError(
            f"Anthropic generation request failed after {attempt} attempts: {last_exception}",
            status_code=status_code,
            original_error=last_exception,
        )
