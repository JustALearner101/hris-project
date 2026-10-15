"""Plain text and Markdown document loader adapters."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path

from src.ingestion.exceptions import EmptyDocumentError, UnsupportedFormatError
from src.ingestion.interface import BaseDocumentLoader, Document


def compute_content_hash(data: bytes) -> str:
    """Compute SHA-256 hexadecimal hash from raw document bytes."""
    return hashlib.sha256(data).hexdigest()


def get_current_utc_timestamp() -> str:
    """Return formatted ISO 8601 UTC timestamp."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class TextDocumentLoader(BaseDocumentLoader):
    """Loader adapter for plain text files (.txt)."""

    SUPPORTED_EXTENSIONS = {".txt"}

    def supports(self, file_path: Path) -> bool:
        return file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS

    def load(self, file_path: Path, actor: str = "system") -> Document:
        path = Path(file_path)
        if not self.supports(path):
            raise UnsupportedFormatError(
                f"Unsupported file extension '{path.suffix}' for TextDocumentLoader",
                file_path=str(path),
            )

        raw_bytes = path.read_bytes()
        if not raw_bytes:
            raise EmptyDocumentError(f"Document '{path}' is empty (0 bytes).", file_path=str(path))

        try:
            content = raw_bytes.decode("utf-8").strip()
        except UnicodeDecodeError:
            # Fallback to latin-1
            content = raw_bytes.decode("latin-1").strip()

        if not content:
            raise EmptyDocumentError(
                f"Document '{path}' contains no extractable text characters.",
                file_path=str(path),
            )

        content_hash = compute_content_hash(raw_bytes)
        now_ts = get_current_utc_timestamp()
        doc_id = f"doc_{content_hash[:16]}"

        return Document(
            id=doc_id,
            content=content,
            source_path=str(path.resolve()),
            file_type="txt",
            file_size_bytes=len(raw_bytes),
            content_hash=content_hash,
            created_at=now_ts,
            created_by=actor,
            updated_at=now_ts,
            updated_by=actor,
            metadata={
                "filename": path.name,
                "encoding": "utf-8",
            },
        )


class MarkdownDocumentLoader(BaseDocumentLoader):
    """Loader adapter for Markdown documents (.md)."""

    SUPPORTED_EXTENSIONS = {".md", ".markdown"}

    def supports(self, file_path: Path) -> bool:
        return file_path.suffix.lower() in self.SUPPORTED_EXTENSIONS

    def load(self, file_path: Path, actor: str = "system") -> Document:
        path = Path(file_path)
        if not self.supports(path):
            raise UnsupportedFormatError(
                f"Unsupported file extension '{path.suffix}' for MarkdownDocumentLoader",
                file_path=str(path),
            )

        raw_bytes = path.read_bytes()
        if not raw_bytes:
            raise EmptyDocumentError(f"Markdown document '{path}' is empty (0 bytes).", file_path=str(path))

        content = raw_bytes.decode("utf-8").strip()
        if not content:
            raise EmptyDocumentError(
                f"Markdown document '{path}' contains no extractable text.",
                file_path=str(path),
            )

        content_hash = compute_content_hash(raw_bytes)
        now_ts = get_current_utc_timestamp()
        doc_id = f"doc_{content_hash[:16]}"

        return Document(
            id=doc_id,
            content=content,
            source_path=str(path.resolve()),
            file_type="md",
            file_size_bytes=len(raw_bytes),
            content_hash=content_hash,
            created_at=now_ts,
            created_by=actor,
            updated_at=now_ts,
            updated_by=actor,
            metadata={
                "filename": path.name,
                "format": "markdown",
            },
        )
