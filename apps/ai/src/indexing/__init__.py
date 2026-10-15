"""Text Indexing, Chunking, and Embedding Package."""

from src.indexing.adapters.bge_embedder import BgeM3Embedder
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.adapters.langchain_chunker import LangChainRecursiveChunker
from src.indexing.exceptions import (
    ContextLengthExceededError,
    IndexingError,
    ModelLoadError,
    VectorStoreError,
)
from src.indexing.interface import (
    BaseChunker,
    BaseEmbedder,
    BaseVectorStore,
    ChunkingConfig,
    DocumentChunk,
    EmbeddingConfig,
    VectorStoreConfig,
)

__all__ = [
    "BaseChunker",
    "BaseEmbedder",
    "BaseVectorStore",
    "BgeM3Embedder",
    "ChromaVectorStore",
    "ChunkingConfig",
    "ContextLengthExceededError",
    "DocumentChunk",
    "EmbeddingConfig",
    "IndexingError",
    "LangChainRecursiveChunker",
    "ModelLoadError",
    "VectorStoreConfig",
    "VectorStoreError",
]

