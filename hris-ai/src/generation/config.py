"""Configuration management and environment resolution for LLM generation."""

import os
from dataclasses import dataclass
from typing import Optional

from src.generation.exceptions import GenerationConfigError


DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-20241022"
SUPPORTED_PROVIDERS = ("openai", "anthropic")


@dataclass(frozen=True)
class GenerationConfig:
    """Immutable configuration dataclass for LLM generation adapters."""

    provider: str = "openai"
    model_name: str = DEFAULT_OPENAI_MODEL
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: float = 0.0
    max_tokens: int = 4096
    timeout_seconds: float = 30.0
    max_retries: int = 2

    def __post_init__(self) -> None:
        normalized_provider = self.provider.strip().lower()
        if normalized_provider not in SUPPORTED_PROVIDERS:
            raise GenerationConfigError(
                f"Unsupported provider '{self.provider}'. Must be one of {SUPPORTED_PROVIDERS}."
            )
        # Use object.__setattr__ because the dataclass is frozen
        object.__setattr__(self, "provider", normalized_provider)

        if self.base_url:
            cleaned_base_url = self.base_url.strip()
            if "sumopod" in cleaned_base_url.lower() and not cleaned_base_url.rstrip("/").endswith("/v1"):
                cleaned_base_url = f"{cleaned_base_url.rstrip('/')}/v1"
            object.__setattr__(self, "base_url", cleaned_base_url)

        if not (0.0 <= self.temperature <= 2.0):
            raise GenerationConfigError(
                f"Temperature must be between 0.0 and 2.0, got {self.temperature}."
            )
        if self.max_tokens < 1:
            raise GenerationConfigError(
                f"max_tokens must be >= 1, got {self.max_tokens}."
            )
        if self.timeout_seconds <= 0.0:
            raise GenerationConfigError(
                f"timeout_seconds must be > 0.0, got {self.timeout_seconds}."
            )
        if self.max_retries < 0:
            raise GenerationConfigError(
                f"max_retries must be >= 0, got {self.max_retries}."
            )

    @classmethod
    def from_env(
        cls,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        timeout_seconds: Optional[float] = None,
        max_retries: Optional[int] = None,
    ) -> "GenerationConfig":
        """Resolve configuration from explicit parameters and environment variables.

        Resolution hierarchy:
        1. Explicit parameter passed to this function.
        2. Unified environment variable (`LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`).
        3. Provider-specific fallback (`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, etc.).
        """
        # 1. Resolve provider
        resolved_provider = (
            provider
            or os.environ.get("LLM_PROVIDER")
            or "openai"
        ).strip().lower()

        # 2. Resolve API key
        resolved_key = api_key or os.environ.get("LLM_API_KEY")
        if not resolved_key:
            if resolved_provider == "openai":
                resolved_key = os.environ.get("OPENAI_API_KEY")
            elif resolved_provider == "anthropic":
                resolved_key = os.environ.get("ANTHROPIC_API_KEY")

        # 3. Resolve Base URL
        resolved_base_url = base_url or os.environ.get("LLM_BASE_URL")
        if not resolved_base_url:
            if resolved_provider == "openai":
                resolved_base_url = os.environ.get("OPENAI_BASE_URL")
            elif resolved_provider == "anthropic":
                resolved_base_url = os.environ.get("ANTHROPIC_BASE_URL")

        # 4. Resolve Model
        default_model = (
            DEFAULT_OPENAI_MODEL if resolved_provider == "openai" else DEFAULT_ANTHROPIC_MODEL
        )
        resolved_model = model_name or os.environ.get("LLM_MODEL") or default_model

        # 5. Resolve numerical hyperparameters
        resolved_temp = (
            temperature
            if temperature is not None
            else float(os.environ.get("LLM_TEMPERATURE", 0.0))
        )
        resolved_tokens = (
            max_tokens
            if max_tokens is not None
            else int(os.environ.get("LLM_MAX_TOKENS", 4096))
        )
        resolved_timeout = (
            timeout_seconds
            if timeout_seconds is not None
            else float(os.environ.get("LLM_TIMEOUT_SECONDS", 30.0))
        )
        resolved_retries = (
            max_retries
            if max_retries is not None
            else int(os.environ.get("LLM_MAX_RETRIES", 2))
        )

        return cls(
            provider=resolved_provider,
            model_name=resolved_model,
            api_key=resolved_key,
            base_url=resolved_base_url,
            temperature=resolved_temp,
            max_tokens=resolved_tokens,
            timeout_seconds=resolved_timeout,
            max_retries=resolved_retries,
        )
