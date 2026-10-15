"""Domain exceptions for context retrieval and reranking."""

from __future__ import annotations


class RetrievalError(Exception):
    """Base exception for all retrieval and reranking failures."""

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message)
        self.details = details


class InvalidQueryError(RetrievalError):
    """Raised when a search query or its parameters violate validation constraints."""

    pass


class RetrieverConfigurationError(RetrievalError):
    """Raised when retriever dependencies, models, or configurations are missing or incompatible."""

    pass
