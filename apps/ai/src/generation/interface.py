"""Abstract interface definitions for prompt synthesis and grounded generation."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Sequence

from src.retrieval.interface import RetrievalResult


@dataclass(frozen=True)
class Citation:
    """Represents a traceable citation linking an answer statement to a source chunk."""

    document_id: str
    chunk_id: str
    relevance_score: float
    reference_snippet: str

    def __post_init__(self) -> None:
        if not self.document_id.strip():
            raise ValueError("document_id must not be empty.")
        if not self.chunk_id.strip():
            raise ValueError("chunk_id must not be empty.")
        if not (0.0 <= self.relevance_score <= 1.0):
            raise ValueError(
                f"relevance_score must be between 0.0 and 1.0, got {self.relevance_score}."
            )


@dataclass(frozen=True)
class GenerationResult:
    """Represents the generated answer with full grounding attribution metadata."""

    query: str
    answer: str
    citations: Sequence[Citation] = field(default_factory=list)
    has_sufficient_context: bool = True


class BaseGenerator(ABC):
    """Abstract base class for grounded prompt synthesis and LLM generation."""

    @abstractmethod
    def generate(
        self,
        query: str,
        context: Sequence[RetrievalResult],
    ) -> GenerationResult:
        """Synthesize a grounded answer with citations given retrieved context."""
        raise NotImplementedError

    def generate_stream(
        self,
        query: str,
        context: Sequence[RetrievalResult],
    ):
        """Stream generated text chunks in realtime given retrieved context."""
        raise NotImplementedError

