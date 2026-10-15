"""Unit tests for ChromaVectorStore and VectorStoreConfig."""

from __future__ import annotations

from pathlib import Path
import pytest

from src.indexing.interface import DocumentChunk, VectorStoreConfig


def test_vector_store_config_defaults() -> None:
    """Verify default parameters for VectorStoreConfig."""
    config = VectorStoreConfig()
    assert config.persist_directory == Path("data/vector_store/chroma")
    assert config.collection_name == "rag_documents"
    assert config.distance_metric == "cosine"


def test_vector_store_config_validation() -> None:
    """Verify validation constraints on VectorStoreConfig parameters."""
    with pytest.raises(ValueError, match="collection_name cannot be empty"):
        VectorStoreConfig(collection_name="")

    with pytest.raises(ValueError, match="distance_metric must be 'cosine'"):
        VectorStoreConfig(distance_metric="l2")


def test_metadata_serialization_scalar_and_complex(tmp_path: Path) -> None:
    """Verify scalar preservation and JSON serialization for complex structures."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_meta")
    )

    chunk_with_none_page = DocumentChunk(
        chunk_id="doc1#c0000",
        document_id="doc1",
        chunk_index=0,
        text="Sample text without page",
        char_start=0,
        char_end=24,
        created_at="2026-10-05T12:00:00Z",
        created_by="tester",
        page_number=None,
        metadata={"category": "tech", "tags": ["nlp", "rag"], "nested": {"key": "val"}},
    )

    serialized = store._serialize_metadata(chunk_with_none_page)

    assert serialized["document_id"] == "doc1"
    assert serialized["chunk_index"] == 0
    assert serialized["char_start"] == 0
    assert serialized["char_end"] == 24
    assert serialized["created_at"] == "2026-10-05T12:00:00Z"
    assert serialized["created_by"] == "tester"
    assert serialized["page_number"] == -1
    assert serialized["category"] == "tech"
    # Complex metadata converted to JSON string
    assert isinstance(serialized["tags_json"], str)
    assert '["nlp", "rag"]' in serialized["tags_json"]
    assert isinstance(serialized["nested_json"], str)

    # Test roundtrip deserialization
    deserialized_chunk = store._deserialize_chunk(
        chunk_id=chunk_with_none_page.chunk_id,
        text=chunk_with_none_page.text,
        metadata=serialized,
    )
    assert deserialized_chunk.chunk_id == chunk_with_none_page.chunk_id
    assert deserialized_chunk.page_number is None
    assert deserialized_chunk.metadata["category"] == "tech"
    assert deserialized_chunk.metadata["tags"] == ["nlp", "rag"]
    assert deserialized_chunk.metadata["nested"] == {"key": "val"}


def test_add_chunks_mismatched_lengths(tmp_path: Path) -> None:
    """Verify add_chunks raises ValueError if chunk count does not match embedding count."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_mismatch")
    )

    chunk = DocumentChunk(
        chunk_id="doc1#c0000",
        document_id="doc1",
        chunk_index=0,
        text="Test",
        char_start=0,
        char_end=4,
        created_at="2026-10-05T12:00:00Z",
    )

    with pytest.raises(ValueError, match="Mismatched counts"):
        store.add_chunks([chunk], [])


def test_add_chunks_empty(tmp_path: Path) -> None:
    """Verify add_chunks handles empty inputs gracefully without error."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_empty")
    )
    store.add_chunks([], [])
    assert store.collection.count() == 0


def test_add_chunks_persistence_and_idempotency(tmp_path: Path) -> None:
    """Verify chunks and embeddings are persisted and upserts are idempotent."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store_dir = tmp_path / "chroma_persistence"
    config = VectorStoreConfig(persist_directory=store_dir, collection_name="test_idempotency")

    chunk = DocumentChunk(
        chunk_id="doc_persist#c0000",
        document_id="doc_persist",
        chunk_index=0,
        text="Persistence test chunk text.",
        char_start=0,
        char_end=28,
        created_at="2026-10-05T12:00:00Z",
        created_by="auditor",
        page_number=3,
        metadata={"source": "report.pdf"},
    )
    embedding = [0.1] * 1024

    # Initial upsert
    store1 = ChromaVectorStore(config=config)
    store1.add_chunks([chunk], [embedding])
    assert store1.collection.count() == 1

    # Idempotent upsert with same chunk_id
    chunk_updated = DocumentChunk(
        chunk_id="doc_persist#c0000",
        document_id="doc_persist",
        chunk_index=0,
        text="Updated persistence test chunk text.",
        char_start=0,
        char_end=36,
        created_at="2026-10-05T12:01:00Z",
        created_by="auditor_v2",
        page_number=3,
        metadata={"source": "report.pdf", "version": 2},
    )
    store1.add_chunks([chunk_updated], [embedding])
    assert store1.collection.count() == 1

    # Re-open client from same directory to verify durability across client instances
    store2 = ChromaVectorStore(config=config)
    assert store2.collection.count() == 1

    results = store2.similarity_search(embedding, top_k=1)
    assert len(results) == 1
    retrieved_chunk, score = results[0]
    assert retrieved_chunk.chunk_id == "doc_persist#c0000"
    assert retrieved_chunk.text == "Updated persistence test chunk text."
    assert retrieved_chunk.char_end == 36
    assert retrieved_chunk.created_by == "auditor_v2"
    assert retrieved_chunk.page_number == 3
    assert retrieved_chunk.metadata["version"] == 2
