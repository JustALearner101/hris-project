"""Domain exceptions for the document ingestion pipeline."""

from __future__ import annotations


class IngestionError(Exception):
    """Base exception for all document ingestion failures."""

    def __init__(self, message: str, file_path: str | None = None) -> None:
        super().__init__(message)
        self.file_path = file_path


class UnsupportedFormatError(IngestionError):
    """Raised when an unsupported file format or extension is encountered."""

    pass


class EmptyDocumentError(IngestionError):
    """Raised when an ingested file has 0 bytes or yields 0 extractable text characters."""

    pass


class CorruptedDocumentError(IngestionError):
    """Raised when a document cannot be parsed due to corrupt file headers or data streams."""

    pass
