"""Document ingestion service and loader registry."""

from __future__ import annotations

from pathlib import Path
from typing import Sequence

from src.ingestion.adapters.ocr_loader import (
    DocxDocumentLoader,
    OCRDocumentLoader,
)
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


class DocumentLoaderRegistry:
    """Registry maintaining available format loaders."""

    def __init__(self, loaders: Sequence[BaseDocumentLoader] | None = None) -> None:
        self._loaders: list[BaseDocumentLoader] = list(loaders) if loaders is not None else []
        if not self._loaders:
            # Register default standard loaders
            self.register(TextDocumentLoader())
            self.register(MarkdownDocumentLoader())
            self.register(PDFDocumentLoader())
            self.register(DocxDocumentLoader())
            self.register(OCRDocumentLoader())

    def register(self, loader: BaseDocumentLoader) -> None:
        """Register a new document loader adapter."""
        self._loaders.append(loader)

    def get_loader(self, file_path: Path) -> BaseDocumentLoader:
        """Retrieve the appropriate loader for the target file."""
        for loader in self._loaders:
            if loader.supports(file_path):
                return loader
        raise UnsupportedFormatError(
            f"No loader registered supporting format '{file_path.suffix}' for file '{file_path}'.",
            file_path=str(file_path),
        )

    def get_ocr_loader(self) -> OCRDocumentLoader:
        """Retrieve a registered OCRDocumentLoader or instantiate a default one."""
        for loader in self._loaders:
            if isinstance(loader, OCRDocumentLoader):
                return loader
        return OCRDocumentLoader()


class DocumentIngestionService:
    """Primary service coordinating multi-format document ingestion and audit tracking."""

    def __init__(
        self,
        registry: DocumentLoaderRegistry | None = None,
        ocr_loader: OCRDocumentLoader | None = None,
    ) -> None:
        self.registry = registry or DocumentLoaderRegistry()
        self.ocr_loader = ocr_loader

    def ingest_file(self, file_path: Path | str, actor: str = "system") -> Document:
        """Ingest a single document file, falling back to OCR if a digital PDF yields 0 text."""
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"File not found: '{path}'")

        loader = self.registry.get_loader(path)
        try:
            return loader.load(path, actor=actor)
        except EmptyDocumentError:
            if isinstance(loader, PDFDocumentLoader) and path.stat().st_size > 0:
                ocr = self.ocr_loader or self.registry.get_ocr_loader()
                return ocr.load(path, actor=actor)
            raise

    def ingest_batch(
        self,
        file_paths: Sequence[Path | str],
        actor: str = "system",
    ) -> IngestionBatchResult:
        """Ingest multiple documents, isolating individual failures."""
        successful: list[Document] = []
        failed: list[IngestionFailure] = []

        for p in file_paths:
            path = Path(p)
            try:
                doc = self.ingest_file(path, actor=actor)
                successful.append(doc)
            except UnsupportedFormatError as err:
                failed.append(IngestionFailure(
                    file_path=str(path),
                    error_code="UNSUPPORTED_FORMAT",
                    error_message=str(err),
                ))
            except EmptyDocumentError as err:
                failed.append(IngestionFailure(
                    file_path=str(path),
                    error_code="EMPTY_FILE",
                    error_message=str(err),
                ))
            except CorruptedDocumentError as err:
                failed.append(IngestionFailure(
                    file_path=str(path),
                    error_code="CORRUPTED_FILE",
                    error_message=str(err),
                ))
            except FileNotFoundError as err:
                failed.append(IngestionFailure(
                    file_path=str(path),
                    error_code="FILE_NOT_FOUND",
                    error_message=str(err),
                ))
            except Exception as err:
                failed.append(IngestionFailure(
                    file_path=str(path),
                    error_code="UNEXPECTED_ERROR",
                    error_message=str(err),
                ))

        return IngestionBatchResult(
            successful_documents=successful,
            failed_documents=failed,
        )
