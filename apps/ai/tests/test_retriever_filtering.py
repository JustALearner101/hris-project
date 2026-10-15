"""Unit tests for metadata filtering and score thresholding in DenseRetriever."""

from __future__ import annotations

from unittest.mock import MagicMock
import pytest

from src.indexing.interface import BaseEmbedder, BaseVectorStore, DocumentChunk
from src.retrieval.adapters.dense_retriever import DenseRetriever
from src.retrieval.interface import RetrievalQuery


def create_test_chunk(chunk_id: str, doc_id: str, text: str, category: str = "general") -> DocumentChunk:
    """Helper to construct a valid test DocumentChunk."""
    return DocumentChunk(
        chunk_id=chunk_id,
        document_id=doc_id,
        chunk_index=0,
        text=text,
        char_start=0,
        char_end=len(text),
        created_at="2026-10-05T12:00:00Z",
        created_by="filter_tester",
        metadata={"category": category},
    )


def test_metadata_filtering_delegation() -> None:
    """Verify where filter is faithfully forwarded to vector_store.similarity_search."""
    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    mock_embedder.embed_query.return_value = [0.1] * 1024
    chunk = create_test_chunk("c_fin", "doc_fin", "Financial report", category="finance")
    mock_store.similarity_search.return_value = [(chunk, 0.90)]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)

    # 1. Using where argument directly
    results = retriever.retrieve("revenue Q3", top_k=3, where={"category": "finance"})
    assert len(results) == 1
    assert results[0].chunk.chunk_id == "c_fin"
    mock_store.similarity_search.assert_called_with(
        query_embedding=[0.1] * 1024,
        top_k=3,
        where={"category": "finance"},
    )

    # 2. Using RetrievalQuery object
    query_obj = RetrievalQuery(
        query_text="revenue Q3",
        top_k=5,
        metadata_filter={"category": "finance"},
    )
    results_obj = retriever.retrieve(query_obj)
    assert len(results_obj) == 1
    mock_store.similarity_search.assert_called_with(
        query_embedding=[0.1] * 1024,
        top_k=5,
        where={"category": "finance"},
    )


def test_metadata_filtering_zero_match() -> None:
    """Verify zero-match filter scenario returns an empty list without error."""
    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    mock_embedder.embed_query.return_value = [0.1] * 1024
    mock_store.similarity_search.return_value = []

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)
    results = retriever.retrieve("query", where={"nonexistent_key": "val"})

    assert results == []


def test_score_thresholding_cutoff() -> None:
    """Verify chunks below score_threshold are discarded and surviving chunks re-ranked."""
    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    mock_embedder.embed_query.return_value = [0.2] * 1024

    c1 = create_test_chunk("c1", "d1", "Chunk 1")
    c2 = create_test_chunk("c2", "d2", "Chunk 2")
    c3 = create_test_chunk("c3", "d3", "Chunk 3")
    c4 = create_test_chunk("c4", "d4", "Chunk 4")

    # Store returns descending candidates
    mock_store.similarity_search.return_value = [
        (c1, 0.85),
        (c2, 0.72),
        (c3, 0.58),
        (c4, 0.35),
    ]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)

    # Cutoff at 0.65 -> Only c1 (0.85) and c2 (0.72) survive
    results = retriever.retrieve("Test question", top_k=4, score_threshold=0.65)

    assert len(results) == 2
    assert results[0].chunk.chunk_id == "c1"
    assert results[0].score == 0.85
    assert results[0].rank == 1

    assert results[1].chunk.chunk_id == "c2"
    assert results[1].score == 0.72
    assert results[1].rank == 2


def test_score_thresholding_out_of_domain_abstention() -> None:
    """Verify out-of-domain query returns [] when all scores fall below threshold."""
    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    mock_embedder.embed_query.return_value = [0.2] * 1024

    c1 = create_test_chunk("c1", "d1", "Weak match 1")
    c2 = create_test_chunk("c2", "d2", "Weak match 2")

    mock_store.similarity_search.return_value = [
        (c1, 0.42),
        (c2, 0.31),
    ]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)

    # Threshold set to 0.70
    results = retriever.retrieve("Completely irrelevant query", score_threshold=0.70)
    assert results == []

    # Also test retrieve_context returns 0 candidates
    ctx = retriever.retrieve_context("Completely irrelevant query", score_threshold=0.70)
    assert ctx.total_candidates_found == 0
    assert len(ctx.results) == 0


def test_score_thresholding_disabled_by_default() -> None:
    """Verify when score_threshold is None, all candidates are returned without filtering."""
    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    mock_embedder.embed_query.return_value = [0.2] * 1024

    c1 = create_test_chunk("c1", "d1", "Low match")
    mock_store.similarity_search.return_value = [(c1, 0.25)]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)

    # Default score_threshold is None
    results = retriever.retrieve("Query without threshold")
    assert len(results) == 1
    assert results[0].score == 0.25
