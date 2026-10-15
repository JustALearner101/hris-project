"""Abstract interface definitions and data models for document ingestion."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Document:
    """Represents an ingested document record with full audit metadata."""

    id: str
    content: str
    source_path: str
    file_type: str
    file_size_bytes: int
    content_hash: str
    created_at: str
    created_by: str = "system"
    updated_at: str = ""
    updated_by: str = "system"
    metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.updated_at:
            # Set updated_at equal to created_at by default
            object.__setattr__(self, "updated_at", self.created_at)


class BaseDocumentLoader(ABC):
    """Abstract base class for format-specific document loaders."""

    @abstractmethod
    def supports(self, file_path: Path) -> bool:
        """Return True if this loader can parse the specified file."""
        raise NotImplementedError

    @abstractmethod
    def load(self, file_path: Path, actor: str = "system") -> Document:
        """Extract text and metadata from the document into a standardized Document record."""
        raise NotImplementedError
