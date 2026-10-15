"""Unit tests for chunk provenance, deterministic IDs, exact offsets, and audit lineage."""

from __future__ import annotations

from datetime import datetime
import re

import pytest

from src.indexing.adapters.langchain_chunker import LangChainRecursiveChunker
from src.indexing.interface import ChunkingConfig
from src.ingestion.interface import Document


def _make_document(
    content: str,
    doc_id: str = "doc_test_lineage",
    pages: list[dict] | None = None,
) -> Document:
    metadata = {"category": "test-data", "confidential": False}
    if pages is not None:
        metadata["pages"] = pages

    return Document(
        id=doc_id,
        content=content,
        source_path="/data/sample.txt",
        file_type="txt",
        file_size_bytes=len(content.encode("utf-8")),
        content_hash="deadbeef" * 8,
        created_at="2026-10-05T09:00:00Z",
        created_by="ingest_actor",
        updated_at="2026-10-05T09:00:00Z",
        updated_by="ingest_actor",
        metadata=metadata,
    )


def test_chunk_id_deterministic_format():
    """Verify chunk ID matches {doc_id}#c{index:04d} format."""
    text = "First block of text content.\n\nSecond block of text content.\n\nThird block of content."
    doc = _make_document(text, doc_id="doc_xyz789")

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=40, chunk_overlap=10)
    chunks = chunker.chunk_document(doc, config=config)

    assert len(chunks) >= 3
    pattern = re.compile(r"^doc_xyz789#c\d{4}$")
    for idx, c in enumerate(chunks):
        assert pattern.match(c.chunk_id)
        assert c.chunk_id == f"doc_xyz789#c{idx:04d}"
        assert c.chunk_index == idx
        assert c.document_id == "doc_xyz789"


def test_chunk_exact_character_offsets():
    """Verify that doc.content[char_start:char_end] strictly equals chunk.text."""
    text = (
        "Retrieval-Augmented Generation combines generative LLMs with external knowledge.\n\n"
        "By slicing parent documents into coherent chunks, vector search retrieves precise context.\n\n"
        "Every chunk must maintain reproducible character coordinates for audit verification.\n\n"
        "This ensures end-to-end traceability back to the exact source position in the original text."
    )
    doc = _make_document(text)

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=120, chunk_overlap=30)
    chunks = chunker.chunk_document(doc, config=config)

    assert len(chunks) > 1
    for chunk in chunks:
        # Strict offset slice equivalence
        sliced = doc.content[chunk.char_start:chunk.char_end]
        assert sliced == chunk.text, (
            f"Offset mismatch for chunk {chunk.chunk_id}: "
            f"expected {chunk.text!r}, got {sliced!r}"
        )
        assert chunk.char_end > chunk.char_start
        assert chunk.char_start >= 0


def test_chunk_audit_fields_and_metadata_propagation():
    """Verify audit fields (created_at, created_by) and metadata propagation."""
    text = "Content for audit tracking test."
    doc = _make_document(text)

    chunker = LangChainRecursiveChunker()
    chunks = chunker.chunk_document(doc, actor="audit_pipeline_user")

    assert len(chunks) == 1
    c = chunks[0]
    assert c.created_by == "audit_pipeline_user"
    assert c.created_at is not None

    # Verify created_at is valid ISO 8601
    parsed_dt = datetime.fromisoformat(c.created_at)
    assert parsed_dt is not None

    # Verify metadata contains source file information and parent hash
    assert c.metadata["source_path"] == "/data/sample.txt"
    assert c.metadata["file_type"] == "txt"
    assert c.metadata["parent_content_hash"] == doc.content_hash
    assert c.metadata["category"] == "test-data"


def test_chunk_page_number_resolution():
    """Verify page number resolution for multi-page documents."""
    page_1 = "This is content from page one of the report."
    page_2 = "This is distinct content from page two of the document."
    full_content = f"{page_1}\n\n{page_2}"

    pages_meta = [
        {"page_number": 1, "character_length": len(page_1)},
        {"page_number": 2, "character_length": len(page_2)},
    ]
    doc = _make_document(full_content, pages=pages_meta)

    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=50, chunk_overlap=10)
    chunks = chunker.chunk_document(doc, config=config)

    assert len(chunks) >= 2
    # First chunk should map to page 1
    assert chunks[0].page_number == 1
    # Last chunk should map to page 2
    assert chunks[-1].page_number == 2
