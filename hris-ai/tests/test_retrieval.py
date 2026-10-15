"""Unit tests for DenseRetriever and core retrieval domain contracts."""

from __future__ import annotations

from unittest.mock import MagicMock
import pytest

from src.indexing.interface import BaseEmbedder, BaseVectorStore, DocumentChunk
from src.retrieval.interface import (
    RetrievalQuery,
    RetrievalResult,
    RetrievedContext,
)


def create_test_chunk(chunk_id: str, doc_id: str, text: str, page: int | None = 1) -> DocumentChunk:
    """Helper to construct a valid test DocumentChunk."""
    return DocumentChunk(
        chunk_id=chunk_id,
        document_id=doc_id,
        chunk_index=0,
        text=text,
        char_start=0,
        char_end=len(text),
        created_at="2026-10-05T12:00:00Z",
        created_by="retrieval_tester",
        page_number=page,
        metadata={"file_type": "pdf"},
    )


def test_retrieval_query_validation() -> None:
    """Verify validation constraints on RetrievalQuery."""
    query = RetrievalQuery(query_text="What is RAG?")
    assert query.query_text == "What is RAG?"
    assert query.top_k == 5
    assert query.metadata_filter is None
    assert query.score_threshold is None

    with pytest.raises(ValueError, match="top_k must be strictly positive"):
        RetrievalQuery(query_text="test", top_k=0)

    with pytest.raises(ValueError, match="score_threshold must be within"):
        RetrievalQuery(query_text="test", score_threshold=1.5)

    with pytest.raises(ValueError, match="score_threshold must be within"):
        RetrievalQuery(query_text="test", score_threshold=-0.1)


def test_retrieval_result_validation() -> None:
    """Verify validation constraints on RetrievalResult."""
    chunk = create_test_chunk("c1", "d1", "Test chunk")
    res = RetrievalResult(chunk=chunk, score=0.85, rank=1)
    assert res.score == 0.85
    assert res.rank == 1

    with pytest.raises(ValueError, match="score must be within"):
        RetrievalResult(chunk=chunk, score=1.2, rank=1)

    with pytest.raises(ValueError, match="rank must be a positive 1-based integer"):
        RetrievalResult(chunk=chunk, score=0.5, rank=0)


def test_dense_retriever_empty_query_short_circuit() -> None:
    """Verify empty or whitespace-only queries return [] without calling embedder or store."""
    from src.retrieval.adapters.dense_retriever import DenseRetriever

    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)

    assert retriever.retrieve("") == []
    assert retriever.retrieve("   \n\t  ") == []
    assert retriever.retrieve(RetrievalQuery(query_text="  ")) == []

    mock_embedder.embed_query.assert_not_called()
    mock_store.similarity_search.assert_not_called()


def test_dense_retriever_top_k_ranking_and_citations() -> None:
    """Verify top-K retrieval returns ranked results with intact citation coordinates."""
    from src.retrieval.adapters.dense_retriever import DenseRetriever

    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    c1 = create_test_chunk("doc1#c0001", "doc1", "High similarity chunk", page=2)
    c2 = create_test_chunk("doc1#c0002", "doc1", "Medium similarity chunk", page=3)

    mock_embedder.embed_query.return_value = [0.1] * 1024
    # Store returns (chunk, score)
    mock_store.similarity_search.return_value = [(c1, 0.92), (c2, 0.78)]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)
    results = retriever.retrieve("What is the architecture?", top_k=2)

    assert len(results) == 2
    mock_embedder.embed_query.assert_called_once_with("What is the architecture?")
    mock_store.similarity_search.assert_called_once_with(
        query_embedding=[0.1] * 1024,
        top_k=2,
        where=None,
    )

    # Check rank order and score
    assert results[0].chunk.chunk_id == "doc1#c0001"
    assert results[0].score == 0.92
    assert results[0].rank == 1
    assert results[0].chunk.char_start == 0
    assert results[0].chunk.char_end == len("High similarity chunk")
    assert results[0].chunk.page_number == 2

    assert results[1].chunk.chunk_id == "doc1#c0002"
    assert results[1].score == 0.78
    assert results[1].rank == 2
    assert results[1].chunk.page_number == 3


def test_dense_retriever_bilingual_query_dispatch() -> None:
    """Verify both English and Indonesian queries execute seamlessly."""
    from src.retrieval.adapters.dense_retriever import DenseRetriever

    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    chunk = create_test_chunk("c1", "d1", "Content in Indonesian and English")
    mock_embedder.embed_query.return_value = [0.5] * 1024
    mock_store.similarity_search.return_value = [(chunk, 0.88)]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)

    # English query
    res_en = retriever.retrieve("How does retrieval work?", top_k=1)
    assert len(res_en) == 1
    assert res_en[0].score == 0.88

    # Indonesian query
    res_id = retriever.retrieve("Bagaimana cara kerja retrieval?", top_k=1)
    assert len(res_id) == 1
    assert res_id[0].score == 0.88


def test_dense_retriever_retrieve_context_container() -> None:
    """Verify retrieve_context returns a complete RetrievedContext object."""
    from src.retrieval.adapters.dense_retriever import DenseRetriever

    mock_embedder = MagicMock(spec=BaseEmbedder)
    mock_store = MagicMock(spec=BaseVectorStore)

    chunk = create_test_chunk("c1", "d1", "Test chunk")
    mock_embedder.embed_query.return_value = [0.1] * 1024
    mock_store.similarity_search.return_value = [(chunk, 0.85)]

    retriever = DenseRetriever(embedder=mock_embedder, vector_store=mock_store)
    ctx = retriever.retrieve_context("Test query", top_k=5)

    assert isinstance(ctx, RetrievedContext)
    assert ctx.query.query_text == "Test query"
    assert ctx.total_candidates_found == 1
    assert len(ctx.results) == 1
    assert ctx.results[0].rank == 1
