"""Grounded Generation Subsystem for prompt synthesis, LLM adapters, and citation attribution."""

from src.generation.adapters.anthropic_generator import AnthropicGenerator
from src.generation.adapters.openai_generator import OpenAIGenerator
from src.generation.citation import (
    DEFAULT_ABSTENTION_MESSAGE_EN,
    DEFAULT_ABSTENTION_MESSAGE_ID,
    SENTINEL_INSUFFICIENT_CONTEXT,
    parse_citations,
)
from src.generation.config import GenerationConfig
from src.generation.exceptions import (
    GenerationAPIError,
    GenerationConfigError,
    GenerationError,
    sanitize_message,
)
from src.generation.factory import get_generator
from src.generation.interface import BaseGenerator, Citation, GenerationResult
from src.generation.prompt import build_grounded_messages

__all__ = [
    "BaseGenerator",
    "Citation",
    "GenerationResult",
    "GenerationConfig",
    "get_generator",
    "OpenAIGenerator",
    "AnthropicGenerator",
    "GenerationError",
    "GenerationConfigError",
    "GenerationAPIError",
    "sanitize_message",
    "build_grounded_messages",
    "parse_citations",
    "SENTINEL_INSUFFICIENT_CONTEXT",
    "DEFAULT_ABSTENTION_MESSAGE_ID",
    "DEFAULT_ABSTENTION_MESSAGE_EN",
]
