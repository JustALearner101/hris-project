"""Document Ingestion Package."""

from src.ingestion.adapters.pdf_loader import PDFDocumentLoader
from src.ingestion.adapters.text_loader import (
    MarkdownDocumentLoader,
    TextDocumentLoader,
)
from src.ingestion.exceptions import (
    CorruptedDocumentError,
    EmptyDocumentError,
    IngestionError,
    UnsupportedFormatError,
)
from src.ingestion.interface import BaseDocumentLoader, Document
from src.ingestion.models import IngestionBatchResult, IngestionFailure
from src.ingestion.service import DocumentIngestionService, DocumentLoaderRegistry

__all__ = [
    "BaseDocumentLoader",
    "Document",
    "TextDocumentLoader",
    "MarkdownDocumentLoader",
    "PDFDocumentLoader",
    "DocumentLoaderRegistry",
    "DocumentIngestionService",
    "IngestionBatchResult",
    "IngestionFailure",
    "IngestionError",
    "UnsupportedFormatError",
    "EmptyDocumentError",
    "CorruptedDocumentError",
]
