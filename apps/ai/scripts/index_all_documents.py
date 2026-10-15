"""Batch ingestion and vector indexing script for all documents in data/raw."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys
import time

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from src.indexing.adapters.bge_embedder import BgeM3Embedder
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.adapters.langchain_chunker import LangChainRecursiveChunker
from src.indexing.interface import ChunkingConfig, EmbeddingConfig, VectorStoreConfig
from src.ingestion.service import DocumentIngestionService


def index_all(
    raw_dir: Path = Path("data/raw"),
    persist_dir: Path = Path("data/vector_store/chroma"),
    collection_name: str = "rag_documents_ioh",
    chunk_size: int = 500,
    chunk_overlap: int = 100,
    batch_size: int = 16,
) -> int:
    """Ingest, chunk, embed, and index all documents in data/raw into ChromaDB."""
    print("=" * 75)
    print("IOH-RAG-POC: Full Corpus Batch Ingestion & Indexing Pipeline")
    print("=" * 75)

    if not raw_dir.exists():
        print(f"[ERROR] Directory not found: {raw_dir}", file=sys.stderr)
        return 1

    # Discover supported files
    supported_extensions = {".pdf", ".txt", ".md", ".markdown"}
    files = [
        f for f in raw_dir.iterdir()
        if f.is_file() and f.suffix.lower() in supported_extensions and not f.name.startswith(".")
    ]

    if not files:
        print(f"[WARNING] No supported documents found in {raw_dir}")
        return 0

    print(f"\n[1/4] Discovered {len(files)} documents in '{raw_dir}'")
    for idx, f in enumerate(files, start=1):
        print(f"  ({idx:02d}) {f.name} ({f.stat().st_size / 1024:.1f} KB)")

    # 1. Ingest Documents
    print("\n[2/4] Parsing documents with DocumentIngestionService...")
    start_time = time.time()
    service = DocumentIngestionService()
    batch_result = service.ingest_batch(files, actor="batch_indexer")

    print(f"  -> Successfully parsed: {len(batch_result.successful_documents)} documents")
    if batch_result.failed_documents:
        print(f"  -> Failed to parse: {len(batch_result.failed_documents)} documents")
        for fail in batch_result.failed_documents:
            print(f"     [FAIL] {fail.file_path.name}: {fail.error_message}")

    if not batch_result.successful_documents:
        print("[ERROR] No documents were successfully parsed.", file=sys.stderr)
        return 1

    # 2. Text Chunking
    print("\n[3/4] Chunking documents with lineage attribution...")
    chunker = LangChainRecursiveChunker()
    chunk_config = ChunkingConfig(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = chunker.chunk_documents(
        batch_result.successful_documents,
        config=chunk_config,
        actor="batch_indexer",
    )
    print(f"  -> Generated {len(chunks)} chunks (size={chunk_size}, overlap={chunk_overlap})")

    # 3. Embedding and Indexing
    print("\n[4/4] Computing embeddings (BGE-M3 100% offline) and persisting into ChromaDB...")
    store_config = VectorStoreConfig(
        persist_directory=persist_dir,
        collection_name=collection_name,
    )
    store = ChromaVectorStore(config=store_config)

    emb_config = EmbeddingConfig(
        model_name="BAAI/bge-m3",
        batch_size=batch_size,
    )
    embedder = BgeM3Embedder(config=emb_config)

    chunk_texts = [c.text for c in chunks]
    print(f"  -> Encoding {len(chunk_texts)} chunks...")
    embeddings = embedder.embed_texts(chunk_texts)

    print(f"  -> Upserting chunks into ChromaDB collection '{collection_name}'...")
    store.add_chunks(chunks, embeddings)

    elapsed = time.time() - start_time
    total_stored = store.collection.count()
    print("\n" + "=" * 75)
    print(f"[SUCCESS] Indexing complete in {elapsed:.2f}s!")
    print(f"Collection '{collection_name}' now holds {total_stored} chunks.")
    print("=" * 75)

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch index all documents in data/raw")
    parser.add_argument("--raw-dir", default="data/raw", help="Path to raw documents folder")
    parser.add_argument("--persist-dir", default="data/vector_store/chroma", help="Path to ChromaDB storage")
    parser.add_argument("--collection", default="rag_documents_ioh", help="Chroma collection name")
    parser.add_argument("--chunk-size", type=int, default=500, help="Chunk size in characters")
    parser.add_argument("--chunk-overlap", type=int, default=100, help="Chunk overlap in characters")
    args = parser.parse_args()

    sys.exit(
        index_all(
            raw_dir=Path(args.raw_dir),
            persist_dir=Path(args.persist_dir),
            collection_name=args.collection,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
        )
    )
