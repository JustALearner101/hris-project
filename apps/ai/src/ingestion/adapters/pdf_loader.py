"""PDF document loader adapter leveraging pypdf."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from pypdf import PdfReader
from pypdf.errors import PdfReadError

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


class PDFDocumentLoader(BaseDocumentLoader):
    """Loader adapter for digital PDF documents using pypdf."""

    SUPPORTED_EXTENSIONS = {".pdf"}

    def supports(self, file_path: Path) -> bool:
        return file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS

    def load(self, file_path: Path, actor: str = "system") -> Document:
        path = Path(file_path)
        if not self.supports(path):
            raise UnsupportedFormatError(
                f"Unsupported file extension '{path.suffix}' for PDFDocumentLoader",
                file_path=str(path),
            )

        raw_bytes = path.read_bytes()
        if not raw_bytes:
            raise EmptyDocumentError(f"PDF document '{path}' is empty (0 bytes).", file_path=str(path))

        try:
            reader = PdfReader(str(path))
        except PdfReadError as err:
            raise CorruptedDocumentError(
                f"Failed to parse PDF document '{path}': {err}",
                file_path=str(path),
            ) from err
        except Exception as err:
            raise CorruptedDocumentError(
                f"Unexpected error reading PDF '{path}': {err}",
                file_path=str(path),
            ) from err

        page_count = len(reader.pages)
        if page_count == 0:
            raise EmptyDocumentError(f"PDF document '{path}' contains 0 pages.", file_path=str(path))

        page_texts: list[str] = []
        pages_metadata: list[dict[str, Any]] = []

        for idx, page in enumerate(reader.pages, start=1):
            extracted = page.extract_text() or ""
            clean_text = extracted.strip()
            if clean_text:
                page_texts.append(clean_text)
            pages_metadata.append({
                "page_number": idx,
                "character_length": len(clean_text),
            })

        if not page_texts:
            raise EmptyDocumentError(
                f"PDF document '{path}' contains no extractable text characters (may be image-only).",
                file_path=str(path),
            )

        full_content = "\n\n".join(page_texts)
        content_hash = compute_content_hash(raw_bytes)
        now_ts = get_current_utc_timestamp()
        doc_id = f"doc_{content_hash[:16]}"

        return Document(
            id=doc_id,
            content=full_content,
            source_path=str(path.resolve()),
            file_type="pdf",
            file_size_bytes=len(raw_bytes),
            content_hash=content_hash,
            created_at=now_ts,
            created_by=actor,
            updated_at=now_ts,
            updated_by=actor,
            metadata={
                "filename": path.name,
                "page_count": page_count,
                "pages": pages_metadata,
            },
        )
