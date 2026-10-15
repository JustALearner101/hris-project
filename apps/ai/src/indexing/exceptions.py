"""Domain exceptions for document chunking, embedding generation, and vector storage."""

from __future__ import annotations


class IndexingError(Exception):
    """Base exception for all document indexing, embedding, and vector storage failures."""

    def __init__(self, message: str, details: str | None = None) -> None:
        super().__init__(message)
        self.details = details


class ModelLoadError(IndexingError):
    """Raised when an embedding model fails to load or initialize."""

    pass


class ContextLengthExceededError(IndexingError):
    """Raised when a text chunk exceeds the maximum supported token context length."""

    def __init__(self, message: str, token_count: int | None = None, max_length: int | None = None) -> None:
        super().__init__(message)
        self.token_count = token_count
        self.max_length = max_length


class VectorStoreError(IndexingError):
    """Raised when a vector store persistence or query operation fails."""

    pass
