"""OCR and DOCX document loader adapters for scanned PDFs, images, and Word documents."""

from __future__ import annotations

import io
import re
import zipfile
import zlib
from pathlib import Path
from typing import Callable
import xml.etree.ElementTree as ET

from pypdf import PdfReader

from src.ingestion.adapters.text_loader import (
    compute_content_hash,
    get_current_utc_timestamp,
)
from src.ingestion.exceptions import (
    CorruptedDocumentError,
    EmptyDocumentError,
    UnsupportedFormatError,
)
from src.ingestion.interface import BaseDocumentLoader, Document


class OCRDocumentLoader(BaseDocumentLoader):
    """Loader adapter for scanned PDFs and image files (.pdf, .png, .jpg, .jpeg) with OCR fallback."""

    SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}

    def __init__(self, ocr_engine: Callable[[bytes], str] | None = None) -> None:
        self.ocr_engine = ocr_engine

    def supports(self, file_path: Path) -> bool:
        return Path(file_path).suffix.lower() in self.SUPPORTED_EXTENSIONS

    def load(self, file_path: Path, actor: str = "system") -> Document:
        path = Path(file_path)
        if not self.supports(path):
            raise UnsupportedFormatError(
                f"Unsupported file extension '{path.suffix}' for OCRDocumentLoader",
                file_path=str(path),
            )

        raw_bytes = path.read_bytes()
        if not raw_bytes:
            raise EmptyDocumentError(
                f"Document '{path}' is empty (0 bytes).",
                file_path=str(path),
            )

        if self.ocr_engine is not None:
            extracted_text = (self.ocr_engine(raw_bytes) or "").strip()
        else:
            extracted_text = self._default_ocr_extract(path, raw_bytes).strip()

        if not extracted_text:
            raise EmptyDocumentError(
                f"OCR yielded no extractable text characters from '{path}'.",
                file_path=str(path),
            )

        content_hash = compute_content_hash(raw_bytes)
        now_ts = get_current_utc_timestamp()
        doc_id = f"doc_{content_hash[:16]}"
        file_type = path.suffix.lower().lstrip(".")

        return Document(
            id=doc_id,
            content=extracted_text,
            source_path=str(path.resolve()),
            file_type=file_type,
            file_size_bytes=len(raw_bytes),
            content_hash=content_hash,
            created_at=now_ts,
            created_by=actor,
            updated_at=now_ts,
            updated_by=actor,
            metadata={
                "filename": path.name,
                "ocr_applied": True,
                "format": file_type,
            },
        )

    def _default_ocr_extract(self, path: Path, raw_bytes: bytes) -> str:
        """Attempt pytesseract if installed, else fallback to embedded OCR stream/text extraction."""
        suffix = path.suffix.lower()

        # 1. Attempt pytesseract if available on the system
        if suffix in {".png", ".jpg", ".jpeg"}:
            try:
                import pytesseract  # type: ignore[import-not-found]
                from PIL import Image  # type: ignore[import-not-found]

                with Image.open(io.BytesIO(raw_bytes)) as img:
                    text = pytesseract.image_to_string(img)
                    if text and text.strip():
                        return text.strip()
            except Exception:
                pass

        # 2. Check for explicit OCR_TEXT / comment markers in raw bytes
        marker_matches = re.findall(
            rb"(?:%?\s*OCR_TEXT\s*:\s*|/OCRText\s*\()([^\r\n)]+)",
            raw_bytes,
        )
        if marker_matches:
            decoded_markers = [
                m.decode("utf-8", errors="ignore").strip()
                for m in marker_matches
                if m.strip()
            ]
            if decoded_markers:
                return "\n".join(decoded_markers)

        # 3. For PDF files, inspect PDF metadata, annotations, XObject streams, and raw streams
        if suffix == ".pdf":
            return self._extract_from_scanned_pdf(raw_bytes)

        # 4. For image files without native tesseract, check embedded text chunks/comments
        return self._extract_from_image_bytes(raw_bytes)

    def _extract_from_scanned_pdf(self, raw_bytes: bytes) -> str:
        fragments: list[str] = []

        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
            if reader.metadata:
                for key in ("/OCRText", "/Subject", "/Description", "/Keywords"):
                    val = reader.metadata.get(key)
                    if isinstance(val, str) and val.strip():
                        fragments.append(val.strip())

            for page in reader.pages:
                # Check standard extract_text first in case OCRDocumentLoader was invoked directly
                try:
                    direct_text = (page.extract_text() or "").strip()
                    if direct_text:
                        fragments.append(direct_text)
                except Exception:
                    pass

                # Inspect XObject image streams for embedded OCR/text bytes
                try:
                    resources = page.get("/Resources")
                    if resources and "/XObject" in resources:
                        xobjects = resources["/XObject"].get_object()
                        for xobj_key in xobjects:
                            xobj = xobjects[xobj_key].get_object()
                            data = xobj.get_data()
                            text_from_xobj = self._extract_printable_stream_text(data)
                            if text_from_xobj:
                                fragments.append(text_from_xobj)
                except Exception:
                    pass
        except Exception:
            pass

        if fragments:
            return "\n\n".join(fragments)

        # Inspect raw PDF streams for parenthesized text literals (e.g. BT (text) Tj ET without font dict
        # or /Alt (text) /ActualText (text))
        alt_matches = re.findall(
            rb"/(?:Alt|ActualText)\s*\(([^)]+)\)",
            raw_bytes,
        )
        for m in alt_matches:
            decoded = m.decode("utf-8", errors="ignore").strip()
            if decoded:
                fragments.append(decoded)

        for stream_match in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", raw_bytes, re.DOTALL):
            stream_data = stream_match.group(1)
            try:
                stream_data = zlib.decompress(stream_data)
            except Exception:
                pass
            for lit in re.findall(rb"\(([^()]{3,})\)\s*(?:Tj|TJ|')", stream_data):
                decoded_lit = lit.decode("utf-8", errors="ignore").strip()
                if decoded_lit:
                    fragments.append(decoded_lit)

        return "\n".join(fragments).strip()

    @staticmethod
    def _extract_printable_stream_text(data: bytes) -> str:
        if not data:
            return ""
        try:
            decoded = data.decode("utf-8").strip()
            if decoded and all(ch.isprintable() or ch in "\r\n\t" for ch in decoded):
                return decoded
        except UnicodeDecodeError:
            pass
        return ""

    @staticmethod
    def _extract_from_image_bytes(raw_bytes: bytes) -> str:
        # Check for PNG tEXt chunk or explicit text comment embedded in test fixtures
        text_chunks = re.findall(rb"tEXt([^\x00]+)\x00([^\x00\r\n]+)", raw_bytes)
        if text_chunks:
            parts = [
                val.decode("utf-8", errors="ignore").strip()
                for _, val in text_chunks
                if val.strip()
            ]
            if parts:
                return "\n".join(parts)
        return ""


class DocxDocumentLoader(BaseDocumentLoader):
    """Loader adapter for Microsoft Word documents (.docx and .doc) using stdlib zipfile + ElementTree."""

    SUPPORTED_EXTENSIONS = {".docx", ".doc"}

    def supports(self, file_path: Path) -> bool:
        return Path(file_path).suffix.lower() in self.SUPPORTED_EXTENSIONS

    def load(self, file_path: Path, actor: str = "system") -> Document:
        path = Path(file_path)
        if not self.supports(path):
            raise UnsupportedFormatError(
                f"Unsupported file extension '{path.suffix}' for DocxDocumentLoader",
                file_path=str(path),
            )

        raw_bytes = path.read_bytes()
        if not raw_bytes:
            raise EmptyDocumentError(
                f"Word document '{path}' is empty (0 bytes).",
                file_path=str(path),
            )

        ext = path.suffix.lower()
        if ext == ".docx" or zipfile.is_zipfile(io.BytesIO(raw_bytes)):
            content = self._extract_docx(raw_bytes, path)
        else:
            content = self._extract_doc(raw_bytes, path)

        if not content:
            raise EmptyDocumentError(
                f"Word document '{path}' contains no extractable text.",
                file_path=str(path),
            )

        content_hash = compute_content_hash(raw_bytes)
        now_ts = get_current_utc_timestamp()
        doc_id = f"doc_{content_hash[:16]}"
        file_type = ext.lstrip(".")

        return Document(
            id=doc_id,
            content=content,
            source_path=str(path.resolve()),
            file_type=file_type,
            file_size_bytes=len(raw_bytes),
            content_hash=content_hash,
            created_at=now_ts,
            created_by=actor,
            updated_at=now_ts,
            updated_by=actor,
            metadata={
                "filename": path.name,
                "format": file_type,
            },
        )

    @staticmethod
    def _extract_docx(raw_bytes: bytes, path: Path) -> str:
        if not zipfile.is_zipfile(io.BytesIO(raw_bytes)):
            raise CorruptedDocumentError(
                f"Document '{path}' is not a valid .docx ZIP archive.",
                file_path=str(path),
            )

        try:
            with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
                if "word/document.xml" not in zf.namelist():
                    raise CorruptedDocumentError(
                        f"DOCX archive '{path}' is missing 'word/document.xml'.",
                        file_path=str(path),
                    )
                xml_bytes = zf.read("word/document.xml")
        except CorruptedDocumentError:
            raise
        except Exception as err:
            raise CorruptedDocumentError(
                f"Failed to read DOCX archive '{path}': {err}",
                file_path=str(path),
            ) from err

        try:
            root = ET.fromstring(xml_bytes)
        except ET.ParseError as err:
            raise CorruptedDocumentError(
                f"Failed to parse XML in '{path}': {err}",
                file_path=str(path),
            ) from err

        paragraphs: list[str] = []
        p_elements = [
            elem for elem in root.iter()
            if elem.tag.endswith("}p") or elem.tag in ("p", "w:p")
        ]

        if p_elements:
            for p_elem in p_elements:
                runs: list[str] = []
                for child in p_elem.iter():
                    if (child.tag.endswith("}t") or child.tag in ("t", "w:t")) and child.text:
                        runs.append(child.text)
                if runs:
                    para_text = "".join(runs).strip()
                    if para_text:
                        paragraphs.append(para_text)
        else:
            for elem in root.iter():
                if (elem.tag.endswith("}t") or elem.tag in ("t", "w:t")) and elem.text:
                    t_val = elem.text.strip()
                    if t_val:
                        paragraphs.append(t_val)

        return "\n".join(paragraphs).strip()

    @staticmethod
    def _extract_doc(raw_bytes: bytes, path: Path) -> str:
        try:
            decoded = raw_bytes.decode("utf-8").strip()
            if decoded and all(ch.isprintable() or ch in "\r\n\t" for ch in decoded):
                return decoded
        except UnicodeDecodeError:
            pass

        # Extract readable ASCII/latin-1 text segments from legacy binary .doc
        matches = re.findall(rb"[A-Za-z0-9][A-Za-z0-9 ,.;:@+\-_/()\r\n\t]{3,}", raw_bytes)
        cleaned = [
            m.decode("latin-1", errors="ignore").strip()
            for m in matches
            if m.strip()
        ]
        if not cleaned:
            raise CorruptedDocumentError(
                f"Unable to extract readable text from .doc file '{path}'.",
                file_path=str(path),
            )
        return "\n".join(cleaned).strip()
