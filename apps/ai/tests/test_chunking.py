"""Unit tests for text chunking adapters, size limits, and overlap preservation."""

from __future__ import annotations

import pytest

from src.indexing.adapters.langchain_chunker import LangChainRecursiveChunker
from src.indexing.interface import ChunkingConfig
from src.ingestion.interface import Document


def _make_sample_doc(text: str, doc_id: str = "doc_test123") -> Document:
    return Document(
        id=doc_id,
        content=text,
        source_path="/fake/test_doc.txt",
        file_type="txt",
        file_size_bytes=len(text.encode("utf-8")),
        content_hash="a" * 64,
        created_at="2026-10-05T10:00:00Z",
        created_by="test_user",
        updated_at="2026-10-05T10:00:00Z",
        updated_by="test_user",
    )


def test_chunking_config_validation():
    """Verify validation constraints on ChunkingConfig."""
    with pytest.raises(ValueError, match="chunk_size must be positive"):
        ChunkingConfig(chunk_size=0)

    with pytest.raises(ValueError, match="chunk_overlap cannot be negative"):
        ChunkingConfig(chunk_size=500, chunk_overlap=-1)

    with pytest.raises(ValueError, match="must be strictly less than chunk_size"):
        ChunkingConfig(chunk_size=500, chunk_overlap=500)


def test_chunk_size_ceiling():
    """Verify that all generated chunks respect the maximum chunk size ceiling."""
    long_text = "This is a meaningful sentence in a long document. " * 50
    doc = _make_sample_doc(long_text)

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=200, chunk_overlap=50)
    chunks = chunker.chunk_document(doc, config=config)

    assert len(chunks) > 1
    for c in chunks:
        assert len(c.text) <= 200, f"Chunk exceeded size 200: {len(c.text)}"


def test_chunk_boundary_overlap():
    """Verify that adjacent chunks share overlapping text context."""
    paragraphs = [
        "First short paragraph info.",
        "Second short paragraph data.",
        "Third short paragraph text.",
        "Fourth short paragraph done.",
    ]
    doc = _make_sample_doc("\n\n".join(paragraphs))

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=80, chunk_overlap=40)
    chunks = chunker.chunk_document(doc, config=config)

    assert len(chunks) >= 2
    # Verify that consecutive chunks share a substring
    for i in range(len(chunks) - 1):
        current_chunk = chunks[i].text
        next_chunk = chunks[i + 1].text
        # Check that there is an overlap match between the end of current and start of next
        overlap_found = any(
            current_chunk.endswith(next_chunk[:k])
            for k in range(15, min(len(next_chunk), len(current_chunk)) + 1)
        )
        assert overlap_found, f"Expected boundary overlap between chunk {i} and {i+1}."


def test_short_document_single_chunk():
    """Verify that a document shorter than chunk_size produces exactly one chunk."""
    short_text = "A concise one-line document."
    doc = _make_sample_doc(short_text)

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=500, chunk_overlap=100)
    chunks = chunker.chunk_document(doc, config=config)

    assert len(chunks) == 1
    assert chunks[0].text == short_text
    assert chunks[0].chunk_index == 0


def test_batch_document_chunking():
    """Verify chunking a batch of documents."""
    doc1 = _make_sample_doc("Document one content. " * 20, doc_id="doc_1")
    doc2 = _make_sample_doc("Document two content. " * 20, doc_id="doc_2")

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=100, chunk_overlap=20)
    all_chunks = chunker.chunk_documents([doc1, doc2], config=config)

    doc1_chunks = [c for c in all_chunks if c.document_id == "doc_1"]
    doc2_chunks = [c for c in all_chunks if c.document_id == "doc_2"]

    assert len(doc1_chunks) > 0
    assert len(doc2_chunks) > 0
    assert len(all_chunks) == len(doc1_chunks) + len(doc2_chunks)
