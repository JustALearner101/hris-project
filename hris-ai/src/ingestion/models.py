"""Data models for ingestion batch processing and operational results."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence

from src.ingestion.interface import Document


@dataclass(frozen=True)
class IngestionFailure:
    """Represents a failed document ingestion attempt within a batch."""

    file_path: str
    error_code: str
    error_message: str


@dataclass(frozen=True)
class IngestionBatchResult:
    """Represents the aggregate result of a batch ingestion operation."""

    successful_documents: Sequence[Document] = field(default_factory=list)
    failed_documents: Sequence[IngestionFailure] = field(default_factory=list)

    @property
    def total_count(self) -> int:
        """Total number of documents processed in the batch."""
        return len(self.successful_documents) + len(self.failed_documents)

    @property
    def success_count(self) -> int:
        """Count of successfully ingested documents."""
        return len(self.successful_documents)

    @property
    def failure_count(self) -> int:
        """Count of failed documents."""
        return len(self.failed_documents)
