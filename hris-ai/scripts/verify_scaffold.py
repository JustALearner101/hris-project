#!/usr/bin/env python3
"""
IOH-RAG-POC Structural Verification Script

Validates the structural completeness and boundary integrity of the workspace.
Leverages purely Python standard library (no external dependencies required).
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

REQUIRED_DIRECTORIES: list[str] = [
    "evaluation",
    "tests",
    "scripts",
    "docs",
    "data",
    "data/raw",
    "data/processed",
    "data/vector_store",
    "data/cache",
    "src",
    "src/ingestion",
    "src/indexing",
    "src/retrieval",
    "src/generation",
]

REQUIRED_FILES: list[str] = [
    ".env.example",
    ".gitignore",
    "pyproject.toml",
    "README.md",
    "docs/architecture.md",
    "scripts/__init__.py",
    "scripts/verify_scaffold.py",
    "tests/__init__.py",
    "tests/test_scaffold.py",
    "src/__init__.py",
    "src/ingestion/__init__.py",
    "src/ingestion/interface.py",
    "src/indexing/__init__.py",
    "src/indexing/interface.py",
    "src/retrieval/__init__.py",
    "src/retrieval/interface.py",
    "src/generation/__init__.py",
    "src/generation/interface.py",
]

CRITICAL_IGNORE_PATTERNS: list[str] = [
    ".env",
    "data/*",
    "*.db",
    "__pycache__/",
    ".pytest_cache/",
]


def verify_scaffold(repo_root: Path) -> tuple[bool, list[str]]:
    """Run verification checks against the repository workspace."""
    errors: list[str] = []

    # 1. Verify Directories
    missing_dirs = [
        d for d in REQUIRED_DIRECTORIES if not (repo_root / d).is_dir()
    ]
    if missing_dirs:
        errors.append(f"Missing directories ({len(missing_dirs)}): {', '.join(missing_dirs)}")

    # 2. Verify Required Files
    missing_files = [
        f for f in REQUIRED_FILES if not (repo_root / f).is_file()
    ]
    if missing_files:
        errors.append(f"Missing files ({len(missing_files)}): {', '.join(missing_files)}")

    # 3. Verify .gitignore patterns
    gitignore_path = repo_root / ".gitignore"
    if gitignore_path.is_file():
        content = gitignore_path.read_text(encoding="utf-8")
        missing_patterns = [p for p in CRITICAL_IGNORE_PATTERNS if p not in content]
        if missing_patterns:
            errors.append(
                f"Missing .gitignore patterns ({len(missing_patterns)}): {', '.join(missing_patterns)}"
            )
    else:
        errors.append("Root .gitignore file is missing.")

    # 4. Verify data/.gitignore
    data_gitignore = repo_root / "data" / ".gitignore"
    if not data_gitignore.is_file():
        errors.append("data/.gitignore isolation file is missing.")

    is_valid = len(errors) == 0
    return is_valid, errors


def main() -> int:
    start_time = time.perf_counter()
    repo_root = Path(__file__).resolve().parent.parent

    print("=" * 60)
    print("IOH-RAG-POC Scaffold Verification")
    print("=" * 60)

    is_valid, errors = verify_scaffold(repo_root)
    elapsed = time.perf_counter() - start_time

    if is_valid:
        print(f"[PASS] Directories ({len(REQUIRED_DIRECTORIES)}/{len(REQUIRED_DIRECTORIES)} verified)")
        print(f"[PASS] Required Files ({len(REQUIRED_FILES)}/{len(REQUIRED_FILES)} verified)")
        print(f"[PASS] Version Control Exclusion Rules ({len(CRITICAL_IGNORE_PATTERNS)} rules verified)")
        print("-" * 60)
        print(f"Status: ALL CHECKS PASSED (Completed in {elapsed:.4f}s)")
        print("=" * 60)
        return 0
    else:
        print("[FAIL] Structural verification failed:")
        for err in errors:
            print(f"  - {err}")
        print("-" * 60)
        print(f"Status: FAILED (Completed in {elapsed:.4f}s)")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
