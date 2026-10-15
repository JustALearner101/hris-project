"""End-to-end smoke test script for the semantic context retrieval and formatting pipeline."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.indexing.adapters.bge_embedder import BgeM3Embedder
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.adapters.langchain_chunker import LangChainRecursiveChunker
from src.indexing.interface import ChunkingConfig, EmbeddingConfig, VectorStoreConfig
from src.ingestion.service import DocumentIngestionService
from src.retrieval.adapters.dense_retriever import DenseRetriever
from src.retrieval.formatter import ContextFormatter
from src.retrieval.interface import RetrievalQuery


def run_pipeline(model_name: str = "BAAI/bge-m3", persist_dir: Path | None = None) -> int:
    print("=" * 75)
    print("IOH-RAG-POC: Running Semantic Retrieval & Context Formatting Smoke Test")
    print("=" * 75)

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

    # 1. Setup & Pre-population
    store_path = persist_dir or Path("data/vector_store/chroma")
    store_config = VectorStoreConfig(
        persist_directory=store_path,
        collection_name="rag_documents_retrieval_smoke",
    )
    store = ChromaVectorStore(config=store_config)

    emb_config = EmbeddingConfig(model_name=model_name)
    embedder = BgeM3Embedder(config=emb_config)

    if store.collection.count() == 0:
        print("\n[1/5] Ingesting and indexing sample documents for retrieval...")
        ingestion_service = DocumentIngestionService()
        batch_result = ingestion_service.ingest_batch(target_files, actor="retrieval_smoke_runner")

        chunker = LangChainRecursiveChunker()
        chunk_config = ChunkingConfig(chunk_size=400, chunk_overlap=80)
        chunks = chunker.chunk_documents(
            batch_result.successful_documents,
            config=chunk_config,
            actor="retrieval_smoke_runner",
        )

        texts = [c.text for c in chunks]
        embeddings = embedder.embed_texts(texts)
        store.add_chunks(chunks, embeddings)
        print(f" -> Indexed {len(chunks)} chunks into '{store_config.collection_name}'")
    else:
        print(f"\n[1/5] Reusing existing {store.collection.count()} chunks in collection.")

    # 2. Retriever Initialization
    print("\n[2/5] Initializing DenseRetriever with dependency-injected adapters...")
    retriever = DenseRetriever(embedder=embedder, vector_store=store)

    # 3. Bilingual Semantic Retrieval Verification
    print("\n[3/5] Testing Bilingual Natural Language Queries...")

    queries = [
        ("English Query", "What are the core principles of the architecture?"),
        ("Indonesian Query", "Apa prinsip utama dalam arsitektur sistem ini?"),
    ]

    for label, query_text in queries:
        print(f"\n  >> {label}: '{query_text}'")
        results = retriever.retrieve(query_text, top_k=3)
        assert len(results) > 0, f"No results returned for query: {query_text}"

        for item in results:
            print(f"     Rank {item.rank}: [{item.chunk.chunk_id}] (Score: {item.score:.4f})")
            print(f"       Offsets: [{item.chunk.char_start}:{item.chunk.char_end}], Page: {item.chunk.page_number}")
            assert 0.0 <= item.score <= 1.0
            assert item.chunk.char_start >= 0
            assert item.chunk.char_end > item.chunk.char_start

    # 4. Scoped Metadata Filtering & Score Thresholding Verification
    print("\n[4/5] Testing Metadata Filtering and Score Thresholding...")

    # Metadata Filter: PDF only
    pdf_results = retriever.retrieve(
        query="system metrics",
        top_k=5,
        where={"file_type": "pdf"},
    )
    print(f"  >> PDF Metadata Filter: Found {len(pdf_results)} matching chunks")
    for r in pdf_results:
        assert r.chunk.metadata.get("file_type") == "pdf"

    # Score Threshold Cutoff
    strict_threshold_results = retriever.retrieve(
        query="Resep membuat rendang sapi padang",
        top_k=5,
        score_threshold=0.85,
    )
    print(f"  >> Out-of-Domain Abstention Query: Found {len(strict_threshold_results)} chunks (Expected: 0)")
    assert len(strict_threshold_results) == 0, "Expected empty list for out-of-domain query with strict threshold"

    # Empty Query Short-Circuit
    empty_results = retriever.retrieve("   ")
    print(f"  >> Empty Query Short-Circuit: Returned {len(empty_results)} results (Expected: 0)")
    assert len(empty_results) == 0

    # 5. Prompt Context Assembly & Citations Formatting Verification
    print("\n[5/5] Testing ContextFormatter Output...")
    sample_results = retriever.retrieve("retrieval-augmented generation", top_k=2)
    formatted_ctx = ContextFormatter.format(sample_results)

    print("  >> Formatted Context Sample:\n" + "-" * 50)
    print(formatted_ctx.context_text[:300] + "\n...")
    print("-" * 50)

    assert len(formatted_ctx.citations) == len(sample_results)
    assert "[1]" in formatted_ctx.context_text
    print(f"  >> Citations Extracted: {len(formatted_ctx.citations)}")
    for cit in formatted_ctx.citations:
        print(f"     Citation [{cit['citation_index']}]: {cit['chunk_id']} (Score: {cit['score']:.4f})")

    print("\n" + "=" * 75)
    print("[SUCCESS] All Context Retrieval and Formatting smoke tests passed!")
    print("=" * 75)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Context Retrieval Smoke Test")
    parser.add_argument("--model", default="BAAI/bge-m3", help="Embedding model name or path")
    parser.add_argument("--persist-dir", default=None, help="Chroma persistence directory")
    args = parser.parse_args()

    persist_path = Path(args.persist_dir) if args.persist_dir else None
    sys.exit(run_pipeline(model_name=args.model, persist_dir=persist_path))
