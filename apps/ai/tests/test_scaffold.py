"""
Automated Scaffold Verification Test Suite

Tests the structural integrity, interface contracts, and ignore boundaries of the workspace.
"""

from __future__ import annotations

import inspect
from pathlib import Path

from scripts.verify_scaffold import (
    CRITICAL_IGNORE_PATTERNS,
    REQUIRED_DIRECTORIES,
    REQUIRED_FILES,
    verify_scaffold,
)
from src.generation.interface import BaseGenerator, Citation, GenerationResult
from src.indexing.interface import (
    BaseChunker,
    BaseEmbedder,
    BaseVectorStore,
    DocumentChunk,
)
from src.ingestion.interface import BaseDocumentLoader, Document
from src.retrieval.interface import BaseRetriever, RetrievalResult

REPO_ROOT = Path(__file__).resolve().parent.parent


def test_directory_structure():
    """Verify that all required repository directories exist."""
    for rel_path in REQUIRED_DIRECTORIES:
        target_dir = REPO_ROOT / rel_path
        assert target_dir.is_dir(), f"Expected directory '{rel_path}' is missing."


def test_required_files_exist():
    """Verify that all required files exist."""
    for rel_path in REQUIRED_FILES:
        target_file = REPO_ROOT / rel_path
        assert target_file.is_file(), f"Expected file '{rel_path}' is missing."


def test_gitignore_exclusion_rules():
    """Verify that root and data gitignore contain critical patterns."""
    root_gitignore = REPO_ROOT / ".gitignore"
    assert root_gitignore.is_file(), "Root .gitignore is missing."
    content = root_gitignore.read_text(encoding="utf-8")
    for pattern in CRITICAL_IGNORE_PATTERNS:
        assert pattern in content, f"Critical pattern '{pattern}' missing from .gitignore."

    data_gitignore = REPO_ROOT / "data" / ".gitignore"
    assert data_gitignore.is_file(), "data/.gitignore is missing."
    data_content = data_gitignore.read_text(encoding="utf-8")
    assert "*" in data_content, "data/.gitignore must wildcard ignore files."


def test_pipeline_package_interfaces():
    """Verify that all pipeline packages export expected abstract interface classes."""
    # Ingestion
    assert inspect.isabstract(BaseDocumentLoader)
    assert Document.__name__ == "Document"

    # Indexing
    assert inspect.isabstract(BaseChunker)
    assert inspect.isabstract(BaseEmbedder)
    assert inspect.isabstract(BaseVectorStore)
    assert DocumentChunk.__name__ == "DocumentChunk"

    # Retrieval
    assert inspect.isabstract(BaseRetriever)
    assert RetrievalResult.__name__ == "RetrievalResult"

    # Generation
    assert inspect.isabstract(BaseGenerator)
    assert Citation.__name__ == "Citation"
    assert GenerationResult.__name__ == "GenerationResult"


def test_standalone_verification_function():
    """Verify that the verification logic passes cleanly."""
    is_valid, errors = verify_scaffold(REPO_ROOT)
    assert is_valid, f"Verification function reported errors: {errors}"
