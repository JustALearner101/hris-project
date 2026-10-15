"""Abstract interface definitions for chunking, embedding, and vector storage."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence

from src.ingestion.interface import Document


@dataclass(frozen=True)
class DocumentChunk:
    """Represents a bounded segment of document text with lineage and audit metadata."""

    chunk_id: str
    document_id: str
    chunk_index: int
    text: str
    char_start: int
    char_end: int
    created_at: str
    created_by: str = "system"
    page_number: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class ChunkingConfig:
    """Configuration parameters governing document text chunking."""

    chunk_size: int = 800
    chunk_overlap: int = 150
    separators: Sequence[str] = ("\n\n", "\n", ". ", " ", "")
    keep_separator: bool = True

    def __post_init__(self) -> None:
        if self.chunk_size <= 0:
            raise ValueError(f"chunk_size must be positive, got {self.chunk_size}")
        if self.chunk_overlap < 0:
            raise ValueError(f"chunk_overlap cannot be negative, got {self.chunk_overlap}")
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError(
                f"chunk_overlap ({self.chunk_overlap}) must be strictly less than chunk_size ({self.chunk_size})"
            )


@dataclass(frozen=True)
class EmbeddingConfig:
    """Configuration governing local embedding model loading and inference."""

    model_name: str = "BAAI/bge-m3"
    cache_folder: Path = field(default_factory=lambda: Path("data/cache/models"))
    batch_size: int = 16
    device: str | None = None
    normalize_embeddings: bool = True
    max_length: int = 8192

    def __post_init__(self) -> None:
        if not self.model_name or not self.model_name.strip():
            raise ValueError("model_name cannot be empty")
        if self.batch_size <= 0:
            raise ValueError(f"batch_size must be positive, got {self.batch_size}")
        if self.max_length <= 0:
            raise ValueError(f"max_length must be positive, got {self.max_length}")


@dataclass(frozen=True)
class VectorStoreConfig:
    """Configuration governing local embedded vector store persistence."""

    persist_directory: Path = field(default_factory=lambda: Path("data/vector_store/chroma"))
    collection_name: str = "rag_documents"
    distance_metric: str = "cosine"

    def __post_init__(self) -> None:
        if not self.collection_name or not self.collection_name.strip():
            raise ValueError("collection_name cannot be empty")
        if self.distance_metric != "cosine":
            raise ValueError(f"distance_metric must be 'cosine', got '{self.distance_metric}'")


class BaseChunker(ABC):
    """Abstract base class for document splitting and chunking strategies."""

    @abstractmethod
    def chunk_document(
        self,
        document: Document,
        config: ChunkingConfig | None = None,
        actor: str = "system",
    ) -> Sequence[DocumentChunk]:
        """Split a single document into sequential, overlapping chunks with lineage."""
        raise NotImplementedError

    @abstractmethod
    def chunk_documents(
        self,
        documents: Sequence[Document],
        config: ChunkingConfig | None = None,
        actor: str = "system",
    ) -> Sequence[DocumentChunk]:
        """Split a collection of documents into sequential chunks."""
        raise NotImplementedError


class BaseEmbedder(ABC):
    """Abstract base class for vector embedding generation."""

    @abstractmethod
    def embed_texts(self, texts: Sequence[str]) -> Sequence[Sequence[float]]:
        """Compute embedding vectors for a batch of text strings."""
        raise NotImplementedError

    @abstractmethod
    def embed_query(self, query: str) -> Sequence[float]:
        """Compute embedding vector for a single query string."""
        raise NotImplementedError


class BaseVectorStore(ABC):
    """Abstract base class for vector store persistence and similarity query operations."""

    @abstractmethod
    def add_chunks(
        self,
        chunks: Sequence[DocumentChunk],
        embeddings: Sequence[Sequence[float]],
    ) -> None:
        """Persist document chunks and their associated embedding vectors."""
        raise NotImplementedError

    @abstractmethod
    def similarity_search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 5,
        where: dict[str, Any] | None = None,
    ) -> Sequence[tuple[DocumentChunk, float]]:
        """Return the top-k most similar document chunks with similarity scores in [0.0, 1.0]."""
        raise NotImplementedError
