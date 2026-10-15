"""Domain exception definitions for the generation subsystem."""

import re
from typing import Optional


def sanitize_message(message: str) -> str:
    """Sanitize potentially sensitive tokens or API keys from error messages."""
    if not message:
        return ""
    # Redact common API key patterns (e.g. sk-..., bearer tokens, 20+ char hex/base64 tokens)
    sanitized = re.sub(r"sk-[a-zA-Z0-9_\-]{16,}", "[REDACTED_API_KEY]", message)
    sanitized = re.sub(
        r"(Bearer\s+)[a-zA-Z0-9_\-\.]{16,}",
        r"\1[REDACTED_TOKEN]",
        sanitized,
        flags=re.IGNORECASE,
    )
    sanitized = re.sub(
        r"(api[_-]?key[\s:=]+)[a-zA-Z0-9_\-]{16,}",
        r"\1[REDACTED_KEY]",
        sanitized,
        flags=re.IGNORECASE,
    )
    return sanitized


class GenerationError(Exception):
    """Base exception for all errors originating within the generation subsystem."""

    def __init__(self, message: str, original_error: Optional[Exception] = None) -> None:
        self.raw_message = message
        self.sanitized_message = sanitize_message(message)
        self.original_error = original_error
        super().__init__(self.sanitized_message)


class GenerationConfigError(GenerationError):
    """Raised when generation configuration or required credentials are missing or invalid."""
    pass


class GenerationAPIError(GenerationError):
    """Raised when external LLM API requests fail due to network, timeout, or rate-limit faults."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        original_error: Optional[Exception] = None,
    ) -> None:
        self.status_code = status_code
        super().__init__(message, original_error=original_error)
