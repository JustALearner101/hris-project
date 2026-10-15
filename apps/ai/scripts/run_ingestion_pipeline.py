"""End-to-end smoke test script for document ingestion and text chunking pipeline."""

from __future__ import annotations

from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.indexing.adapters.langchain_chunker import LangChainRecursiveChunker
from src.indexing.interface import ChunkingConfig
from src.ingestion.service import DocumentIngestionService


def run_pipeline() -> int:
    print("=" * 70)
    print("IOH-RAG-POC: Running Document Ingestion & Chunking Smoke Test")
    print("=" * 70)

    service = DocumentIngestionService()
    chunker = LangChainRecursiveChunker()
    config = ChunkingConfig(chunk_size=300, chunk_overlap=60)

    raw_dir = Path("data/raw")
    target_files = [
        raw_dir / "sample_doc.txt",
        raw_dir / "sample_notes.md",
        raw_dir / "sample_report.pdf",
    ]

    for f in target_files:
        if not f.exists():
            print(f"[ERROR] Required sample document not found: {f}", file=sys.stderr)
            return 1

    print(f"\n[1/3] Ingesting {len(target_files)} documents via DocumentIngestionService...")
    batch_result = service.ingest_batch(target_files, actor="smoke_test_runner")

    print(f" -> Successfully ingested: {len(batch_result.successful_documents)}")
    print(f" -> Failed ingestions:     {len(batch_result.failed_documents)}")

    if len(batch_result.successful_documents) != len(target_files):
        print(f"[FAIL] Expected {len(target_files)} successful ingestions, got {len(batch_result.successful_documents)}", file=sys.stderr)
        return 1

    for doc in batch_result.successful_documents:
        print(f"    * Document [{doc.id}] ({doc.file_type}, {doc.file_size_bytes} bytes, hash: {doc.content_hash[:12]}...)")
        assert doc.created_by == "smoke_test_runner"
        assert doc.created_at.endswith("Z")
        assert len(doc.content_hash) == 64
        assert len(doc.content) > 0

    print("\n[2/3] Chunking documents with LangChainRecursiveChunker (chunk_size=300, chunk_overlap=60)...")
    all_chunks = chunker.chunk_documents(batch_result.successful_documents, config=config, actor="smoke_test_runner")
    print(f" -> Total chunks generated: {len(all_chunks)}")

    for doc in batch_result.successful_documents:
        doc_chunks = [c for c in all_chunks if c.document_id == doc.id]
        print(f"    * Doc [{doc.id}]: {len(doc_chunks)} chunks")
        for chunk in doc_chunks:
            # Verify deterministic ID format
            assert chunk.chunk_id == f"{doc.id}#c{chunk.chunk_index:04d}"
            # Verify exact offset slicing
            sliced_text = doc.content[chunk.char_start:chunk.char_end]
            assert sliced_text == chunk.text, f"Offset mismatch in chunk {chunk.chunk_id}"
            # Verify size limit
            assert len(chunk.text) <= config.chunk_size
            # Verify audit fields
            assert chunk.created_by == "smoke_test_runner"
            assert chunk.created_at.endswith("Z")

    # Verify PDF page tracking
    pdf_chunks = [c for c in all_chunks if c.metadata.get("file_type") == "pdf"]
    pages_observed = {c.page_number for c in pdf_chunks if c.page_number is not None}
    print(f" -> PDF pages tracked across chunks: {sorted(pages_observed)}")
    assert len(pages_observed) >= 1

    print("\n[3/3] Verifying error isolation on empty and corrupted inputs...")
    temp_empty = raw_dir / "temp_empty_smoke.txt"
    temp_empty.write_text("", encoding="utf-8")
    try:
        mixed_batch = service.ingest_batch([
            raw_dir / "sample_doc.txt",
            temp_empty,
        ])
        assert len(mixed_batch.successful_documents) == 1
        assert len(mixed_batch.failed_documents) == 1
        assert mixed_batch.failed_documents[0].error_code == "EMPTY_FILE"
        print(f" -> Error isolation verified: 1 success, 1 isolated error ({mixed_batch.failed_documents[0].error_code})")
    finally:
        if temp_empty.exists():
            temp_empty.unlink()

    print("\n" + "=" * 70)
    print("[SUCCESS] All Ingestion & Chunking pipeline smoke tests passed!")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(run_pipeline())
