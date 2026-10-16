"""Unit tests for OCRDocumentLoader, DocxDocumentLoader, and DocumentIngestionService OCR fallback."""

from __future__ import annotations

import io
from pathlib import Path
import zipfile

import pytest
from pypdf import PdfWriter

from src.ingestion.adapters.ocr_loader import DocxDocumentLoader, OCRDocumentLoader
from src.ingestion.exceptions import (
    CorruptedDocumentError,
    EmptyDocumentError,
    UnsupportedFormatError,
)
from src.ingestion.service import DocumentIngestionService


def _create_docx_bytes(paragraphs: list[str]) -> bytes:
    buf = io.BytesIO()
    p_xml = "".join(
        f"<w:p><w:r><w:t>{text}</w:t></w:r></w:p>" for text in paragraphs
    )
    xml_doc = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{p_xml}</w:body></w:document>"
    )
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("word/document.xml", xml_doc.encode("utf-8"))
    return buf.getvalue()


def _create_blank_pdf_bytes() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_docx_loader_extracts_paragraphs(tmp_path: Path) -> None:
    docx_file = tmp_path / "candidate_cv.docx"
    docx_file.write_bytes(
        _create_docx_bytes(
            [
                "Budi Santoso",
                "budi.santoso@example.com | +62 812 3456 7890",
                "Senior Backend Engineer — Python, C#, .NET, PostgreSQL, Redis",
                "B.Sc. Computer Science, Universitas Indonesia (GPA 3.85)",
            ]
        )
    )

    loader = DocxDocumentLoader()
    assert loader.supports(docx_file)

    doc = loader.load(docx_file, actor="pytest")
    assert doc.file_type == "docx"
    assert "Budi Santoso" in doc.content
    assert "PostgreSQL" in doc.content
    assert doc.metadata["filename"] == "candidate_cv.docx"


def test_docx_loader_rejects_corrupted_zip(tmp_path: Path) -> None:
    bad_docx = tmp_path / "corrupt.docx"
    bad_docx.write_bytes(b"not-a-valid-zip-archive")

    loader = DocxDocumentLoader()
    with pytest.raises(CorruptedDocumentError):
        loader.load(bad_docx)


def test_ocr_loader_with_custom_engine(tmp_path: Path) -> None:
    scanned_pdf = tmp_path / "scanned_resume.pdf"
    scanned_pdf.write_bytes(_create_blank_pdf_bytes())

    loader = OCRDocumentLoader(
        ocr_engine=lambda _b: "Siti Aminah\nsiti@example.com\nSkills: Python, FastAPI, Docker"
    )
    doc = loader.load(scanned_pdf)
    assert doc.metadata["ocr_applied"] is True
    assert "Siti Aminah" in doc.content
    assert "FastAPI" in doc.content


def test_ocr_loader_extracts_embedded_ocr_marker_from_scanned_pdf(tmp_path: Path) -> None:
    scanned_pdf = tmp_path / "scanned_with_marker.pdf"
    raw = _create_blank_pdf_bytes() + b"\n% OCR_TEXT: Andi Wijaya | andi@example.com | React TypeScript\n"
    scanned_pdf.write_bytes(raw)

    service = DocumentIngestionService()
    doc = service.ingest_file(scanned_pdf)
    assert doc.metadata.get("ocr_applied") is True
    assert "Andi Wijaya" in doc.content
    assert "TypeScript" in doc.content


def test_ocr_loader_raises_empty_on_blank_unreadable_pdf(tmp_path: Path) -> None:
    blank_pdf = tmp_path / "blank.pdf"
    blank_pdf.write_bytes(_create_blank_pdf_bytes())

    service = DocumentIngestionService()
    with pytest.raises(EmptyDocumentError):
        service.ingest_file(blank_pdf)


def test_ocr_loader_rejects_unsupported_extension(tmp_path: Path) -> None:
    exe_file = tmp_path / "malware.exe"
    exe_file.write_bytes(b"MZ...")

    loader = OCRDocumentLoader()
    with pytest.raises(UnsupportedFormatError):
        loader.load(exe_file)
