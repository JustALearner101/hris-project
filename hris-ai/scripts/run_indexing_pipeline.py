"""End-to-end smoke test script for the embedding generation and vector storage pipeline."""

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


def run_pipeline(model_name: str = "BAAI/bge-m3", persist_dir: Path | None = None) -> int:
    print("=" * 75)
    print("IOH-RAG-POC: Running Embedding & Vector Storage Pipeline Smoke Test")
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

    # 1. Ingestion
    print(f"\n[1/5] Ingesting {len(target_files)} documents via DocumentIngestionService...")
    ingestion_service = DocumentIngestionService()
    batch_result = ingestion_service.ingest_batch(target_files, actor="indexing_smoke_runner")
    print(f" -> Successfully ingested: {len(batch_result.successful_documents)} documents")

    # 2. Chunking
    print("\n[2/5] Chunking documents with LangChainRecursiveChunker...")
    chunker = LangChainRecursiveChunker()
    chunk_config = ChunkingConfig(chunk_size=400, chunk_overlap=80)
    all_chunks = chunker.chunk_documents(
        batch_result.successful_documents,
        config=chunk_config,
        actor="indexing_smoke_runner",
    )
    print(f" -> Generated {len(all_chunks)} DocumentChunk records")

    # 3. Embedding
    print(f"\n[3/5] Loading embedding engine ({model_name})...")
    emb_config = EmbeddingConfig(model_name=model_name)
    embedder = BgeM3Embedder(config=emb_config)
    print(f" -> Embedder initialized on device='{embedder.device}', cache='{embedder.cache_folder}'")

    texts = [chunk.text for chunk in all_chunks]
    print(f" -> Computing embeddings for {len(texts)} chunks...")
    embeddings = embedder.embed_texts(texts)
    print(f" -> Generated {len(embeddings)} vectors of dimension {len(embeddings[0])}")

    # 4. Vector Storage
    store_path = persist_dir or Path("data/vector_store/chroma")
    print(f"\n[4/5] Persisting into ChromaVectorStore at '{store_path}'...")
    store_config = VectorStoreConfig(
        persist_directory=store_path,
        collection_name="rag_documents_smoke",
    )
    store = ChromaVectorStore(config=store_config)
    store.add_chunks(all_chunks, embeddings)
    print(f" -> Total records in collection: {store.collection.count()}")

    # 5. Multilingual Semantic Search & Filtering Validation
    print("\n[5/5] Executing Top-K Multilingual Semantic Queries...")

    test_queries = [
        ("English Query", "How does retrieval-augmented generation improve hallucination?"),
        ("Indonesian Query", "Bagaimana arsitektur RAG mengurangi halusinasi pada model bahasa?"),
    ]

    for label, query_text in test_queries:
        print(f"\n  >> {label}: '{query_text}'")
        q_vec = embedder.embed_query(query_text)
        results = store.similarity_search(q_vec, top_k=3)

        assert len(results) > 0, f"No results returned for query: {query_text}"
        top_chunk, top_score = results[0]
        print(f"     Top Match: [{top_chunk.chunk_id}] (Score: {top_score:.4f})")
        print(f"     Doc ID:    {top_chunk.document_id}")
        print(f"     Offsets:   [{top_chunk.char_start}:{top_chunk.char_end}]")
        print(f"     Snippet:   {top_chunk.text[:90]}...")

        # Assert score bounds
        assert 0.0 <= top_score <= 1.0, f"Score out of bounds: {top_score}"

    # Metadata filtering check
    print("\n  >> Metadata Filter Query (where={'file_type': 'pdf'})...")
    q_vec = embedder.embed_query("summary metrics table")
    pdf_results = store.similarity_search(q_vec, top_k=5, where={"file_type": "pdf"})
    print(f"     Retrieved {len(pdf_results)} PDF chunks with filter")
    for chunk, score in pdf_results:
        assert chunk.metadata.get("file_type") == "pdf"
        assert chunk.page_number is not None

    print("\n" + "=" * 75)
    print("[SUCCESS] All Embedding & Vector Storage smoke test checks passed!")
    print("=" * 75)
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Embedding & Vector Storage Smoke Test")
    parser.add_argument("--model", default="BAAI/bge-m3", help="Embedding model name or path")
    parser.add_argument("--persist-dir", default=None, help="Chroma persistence directory")
    args = parser.parse_args()

    persist_path = Path(args.persist_dir) if args.persist_dir else None
    sys.exit(run_pipeline(model_name=args.model, persist_dir=persist_path))
