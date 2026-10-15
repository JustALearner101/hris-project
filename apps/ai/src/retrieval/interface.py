"""Abstract interface definitions for context retrieval and reranking."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Sequence

from src.indexing.interface import DocumentChunk


@dataclass(frozen=True)
class RetrievalQuery:
    """Encapsulates input parameters for a semantic retrieval query."""

    query_text: str
    top_k: int = 5
    metadata_filter: dict[str, Any] | None = None
    score_threshold: float | None = None

    def __post_init__(self) -> None:
        if self.top_k <= 0:
            raise ValueError(f"top_k must be strictly positive, got {self.top_k}")
        if self.score_threshold is not None and not (0.0 <= self.score_threshold <= 1.0):
            raise ValueError(
                f"score_threshold must be within [0.0, 1.0] or None, got {self.score_threshold}"
            )


@dataclass(frozen=True)
class RetrievalResult:
    """Represents a retrieved context chunk with attribution score and ranking."""

    chunk: DocumentChunk
    score: float
    rank: int

    def __post_init__(self) -> None:
        if not (0.0 <= self.score <= 1.0):
            raise ValueError(f"score must be within [0.0, 1.0], got {self.score}")
        if self.rank < 1:
            raise ValueError(f"rank must be a positive 1-based integer, got {self.rank}")


@dataclass(frozen=True)
class RetrievedContext:
    """Aggregates the complete retrieval outcome for a query."""

    query: RetrievalQuery
    results: Sequence[RetrievalResult] = field(default_factory=list)
    total_candidates_found: int = 0


@dataclass(frozen=True)
class FormattedContext:
    """Standardized prompt context text and citation metadata for generation."""

    context_text: str
    citations: Sequence[dict[str, Any]] = field(default_factory=list)


class BaseRetriever(ABC):
    """Abstract base class for retrieving and reranking relevant context chunks."""

    @abstractmethod
    def retrieve(
        self,
        query: str | RetrievalQuery,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        score_threshold: float | None = None,
    ) -> Sequence[RetrievalResult]:
        """Retrieve the top-K relevant context chunks matching the query."""
        raise NotImplementedError

    @abstractmethod
    def retrieve_context(
        self,
        query: str | RetrievalQuery,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        score_threshold: float | None = None,
    ) -> RetrievedContext:
        """Retrieve context chunks and return an aggregated RetrievedContext object."""
        raise NotImplementedError
