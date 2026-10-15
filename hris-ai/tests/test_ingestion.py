"""Unit tests for document ingestion and text extraction loaders."""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from src.ingestion.adapters.pdf_loader import PDFDocumentLoader
from src.ingestion.adapters.text_loader import MarkdownDocumentLoader, TextDocumentLoader
from src.ingestion.exceptions import EmptyDocumentError, UnsupportedFormatError
from src.ingestion.service import DocumentIngestionService

REPO_ROOT = Path(__file__).resolve().parent.parent


def test_text_loader_extraction_and_audit():
    """Verify plain text loading, audit timestamps, and character fidelity."""
    sample_txt = REPO_ROOT / "data" / "raw" / "sample_doc.txt"
    loader = TextDocumentLoader()
    assert loader.supports(sample_txt)

    doc = loader.load(sample_txt, actor="ingestion_tester")
    assert doc.file_type == "txt"
    assert doc.created_by == "ingestion_tester"
    assert doc.updated_by == "ingestion_tester"
    assert doc.created_at.endswith("Z")
    assert len(doc.content_hash) == 64
    assert doc.id.startswith("doc_")

    # Character fidelity verification: extracted text exactly matches original file content
    expected_content = sample_txt.read_text(encoding="utf-8").strip()
    assert doc.content == expected_content
    assert doc.file_size_bytes == sample_txt.stat().st_size


def test_markdown_loader_extraction():
    """Verify markdown loading and structure preservation."""
    sample_md = REPO_ROOT / "data" / "raw" / "sample_notes.md"
    loader = MarkdownDocumentLoader()
    assert loader.supports(sample_md)

    doc = loader.load(sample_md, actor="md_tester")
    assert doc.file_type == "md"
    assert "Section 1: Ingestion Best Practices" in doc.content
    assert doc.created_by == "md_tester"


def test_pdf_loader_multi_page_extraction():
    """Verify PDF multi-page extraction and page metadata using pypdf."""
    sample_pdf = REPO_ROOT / "data" / "raw" / "sample_report.pdf"
    loader = PDFDocumentLoader()
    assert loader.supports(sample_pdf)

    doc = loader.load(sample_pdf, actor="pdf_tester")
    assert doc.file_type == "pdf"
    assert "Executive Report - Page 1" in doc.content
    assert "Evaluation Findings - Page 2" in doc.content
    assert doc.metadata.get("page_count") == 2


def test_empty_document_raises_error():
    """Verify that an empty file raises EmptyDocumentError."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
        temp_path = Path(f.name)

    try:
        loader = TextDocumentLoader()
        with pytest.raises(EmptyDocumentError):
            loader.load(temp_path)
    finally:
        temp_path.unlink(missing_ok=True)


def test_unsupported_format_raises_error():
    """Verify that unsupported file extensions raise UnsupportedFormatError."""
    service = DocumentIngestionService()
    with tempfile.NamedTemporaryFile(suffix=".xyz", delete=False) as f:
        f.write(b"Some text content")
        dummy_path = Path(f.name)

    try:
        with pytest.raises(UnsupportedFormatError):
            service.ingest_file(dummy_path)
    finally:
        dummy_path.unlink(missing_ok=True)


def test_batch_ingestion_error_isolation():
    """Verify batch ingestion captures successful docs and isolates failures."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as empty_file:
        empty_path = Path(empty_file.name)

    sample_txt = REPO_ROOT / "data" / "raw" / "sample_doc.txt"
    sample_md = REPO_ROOT / "data" / "raw" / "sample_notes.md"

    try:
        service = DocumentIngestionService()
        result = service.ingest_batch(
            [sample_txt, empty_path, sample_md],
            actor="batch_worker",
        )

        assert result.total_count == 3
        assert result.success_count == 2
        assert result.failure_count == 1
        assert result.failed_documents[0].error_code == "EMPTY_FILE"
        assert result.failed_documents[0].file_path == str(empty_path)
    finally:
        empty_path.unlink(missing_ok=True)
