"""Unit tests for ContextFormatter in src/retrieval/formatter.py."""

from __future__ import annotations

from src.indexing.interface import DocumentChunk
from src.retrieval.interface import FormattedContext, RetrievalResult


def create_test_chunk(
    chunk_id: str,
    doc_id: str,
    text: str,
    page: int | None = 2,
    source_path: str = "/data/raw/report.pdf",
) -> DocumentChunk:
    """Helper to create a test chunk with citation metadata."""
    return DocumentChunk(
        chunk_id=chunk_id,
        document_id=doc_id,
        chunk_index=0,
        text=text,
        char_start=100,
        char_end=100 + len(text),
        created_at="2026-10-05T12:00:00Z",
        created_by="formatter_tester",
        page_number=page,
        metadata={"source_path": source_path},
    )


def test_format_empty_results() -> None:
    """Verify formatting an empty list returns empty context and empty citations."""
    from src.retrieval.formatter import ContextFormatter

    formatted = ContextFormatter.format([])
    assert isinstance(formatted, FormattedContext)
    assert formatted.context_text == ""
    assert formatted.citations == []


def test_format_multiple_results_with_citations() -> None:
    """Verify context formatting includes numbered headers, chunk text, and citation records."""
    from src.retrieval.formatter import ContextFormatter

    c1 = create_test_chunk("doc1#c0001", "doc1", "First context paragraph.", page=1)
    c2 = create_test_chunk("doc2#c0003", "doc2", "Second context paragraph.", page=None, source_path="/data/doc2.txt")

    r1 = RetrievalResult(chunk=c1, score=0.9123, rank=1)
    r2 = RetrievalResult(chunk=c2, score=0.7845, rank=2)

    formatted = ContextFormatter.format([r1, r2])

    # Context text validations
    assert "[1] [Source: /data/raw/report.pdf | Chunk: doc1#c0001 | Page: 1 | Score: 0.9123]" in formatted.context_text
    assert "First context paragraph." in formatted.context_text
    assert "[2] [Source: /data/doc2.txt | Chunk: doc2#c0003 | Page: - | Score: 0.7845]" in formatted.context_text
    assert "Second context paragraph." in formatted.context_text

    # Citation metadata records validation
    assert len(formatted.citations) == 2

    cit1 = formatted.citations[0]
    assert cit1["citation_index"] == 1
    assert cit1["chunk_id"] == "doc1#c0001"
    assert cit1["document_id"] == "doc1"
    assert cit1["page_number"] == 1
    assert cit1["char_start"] == 100
    assert cit1["char_end"] == 100 + len("First context paragraph.")
    assert cit1["score"] == 0.9123

    cit2 = formatted.citations[1]
    assert cit2["citation_index"] == 2
    assert cit2["chunk_id"] == "doc2#c0003"
    assert cit2["page_number"] is None
    assert cit2["score"] == 0.7845


def test_format_without_scores() -> None:
    """Verify include_scores=False removes score from citation headers."""
    from src.retrieval.formatter import ContextFormatter

    c1 = create_test_chunk("doc1#c0001", "doc1", "Plain text without score in header.", page=5)
    r1 = RetrievalResult(chunk=c1, score=0.88, rank=1)

    formatted = ContextFormatter.format([r1], include_scores=False)
    assert "[1] [Source: /data/raw/report.pdf | Chunk: doc1#c0001 | Page: 5]" in formatted.context_text
    assert "Score:" not in formatted.context_text
    # Citation dictionary still retains score attribute
    assert formatted.citations[0]["score"] == 0.88
