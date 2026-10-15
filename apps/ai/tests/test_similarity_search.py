"""Unit tests for top-k similarity search, score normalization, and metadata filtering."""

from __future__ import annotations

from pathlib import Path
import pytest

from src.indexing.interface import DocumentChunk, VectorStoreConfig


def create_sample_chunk(
    chunk_id: str,
    doc_id: str,
    text: str,
    category: str = "general",
) -> DocumentChunk:
    """Helper to generate a test DocumentChunk."""
    return DocumentChunk(
        chunk_id=chunk_id,
        document_id=doc_id,
        chunk_index=0,
        text=text,
        char_start=0,
        char_end=len(text),
        created_at="2026-10-05T12:00:00Z",
        created_by="tester",
        metadata={"category": category},
    )


def test_similarity_search_empty_collection(tmp_path: Path) -> None:
    """Verify searching an empty collection returns an empty list."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_empty")
    )
    query_vec = [1.0] + [0.0] * 1023
    results = store.similarity_search(query_vec, top_k=5)
    assert results == []


def test_similarity_search_ranking_and_score_normalization(tmp_path: Path) -> None:
    """Verify similarity search returns descending order and scores in [0.0, 1.0]."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_rank")
    )

    c1 = create_sample_chunk("c1", "d1", "Exact query match")
    c2 = create_sample_chunk("c2", "d2", "Somewhat similar")
    c3 = create_sample_chunk("c3", "d3", "Completely different")

    # Unit vectors
    v_query = [1.0] + [0.0] * 1023
    v1 = [1.0] + [0.0] * 1023          # Identical: cosine distance = 0.0 -> score = 1.0
    v2 = [0.8, 0.6] + [0.0] * 1022      # Cosine similarity = 0.8 -> distance = 0.2 -> score = 0.8
    v3 = [0.0, 1.0] + [0.0] * 1022      # Orthogonal: cosine similarity = 0.0 -> distance = 1.0 -> score = 0.0

    store.add_chunks([c1, c2, c3], [v1, v2, v3])

    results = store.similarity_search(v_query, top_k=3)

    assert len(results) == 3
    # Top match is c1
    assert results[0][0].chunk_id == "c1"
    assert pytest.approx(results[0][1], abs=1e-3) == 1.0

    # Second match is c2
    assert results[1][0].chunk_id == "c2"
    assert pytest.approx(results[1][1], abs=1e-3) == 0.8

    # Third match is c3
    assert results[2][0].chunk_id == "c3"
    assert pytest.approx(results[2][1], abs=1e-3) == 0.0

    # Scores must be descending and strictly bounded in [0.0, 1.0]
    for _, score in results:
        assert 0.0 <= score <= 1.0
    assert results[0][1] >= results[1][1] >= results[2][1]


def test_similarity_search_top_k_limit(tmp_path: Path) -> None:
    """Verify top_k parameter strictly caps returned results."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_topk")
    )

    chunks = [create_sample_chunk(f"c{i}", f"d{i}", f"Text {i}") for i in range(5)]
    embeddings = [[1.0] + [0.0] * 1023 for _ in range(5)]

    store.add_chunks(chunks, embeddings)

    results = store.similarity_search([1.0] + [0.0] * 1023, top_k=2)
    assert len(results) == 2


def test_similarity_search_metadata_filter(tmp_path: Path) -> None:
    """Verify where parameter filters search candidates by metadata attributes."""
    from src.indexing.adapters.chroma_store import ChromaVectorStore

    store = ChromaVectorStore(
        config=VectorStoreConfig(persist_directory=tmp_path / "chroma", collection_name="test_filter")
    )

    c_hr = create_sample_chunk("c_hr", "hr_doc", "HR Policy manual", category="hr")
    c_fin = create_sample_chunk("c_fin", "fin_doc", "Financial Q3 report", category="finance")
    c_eng = create_sample_chunk("c_eng", "eng_doc", "Engineering architecture", category="engineering")

    v_same = [1.0] + [0.0] * 1023
    store.add_chunks([c_hr, c_fin, c_eng], [v_same, v_same, v_same])

    # Filter for finance category
    results = store.similarity_search(v_same, top_k=10, where={"category": "finance"})
    assert len(results) == 1
    assert results[0][0].chunk_id == "c_fin"
    assert results[0][0].metadata["category"] == "finance"

    # Filter for document_id
    results_hr = store.similarity_search(v_same, top_k=10, where={"document_id": "hr_doc"})
    assert len(results_hr) == 1
    assert results_hr[0][0].chunk_id == "c_hr"
