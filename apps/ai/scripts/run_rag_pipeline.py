"""End-to-end RAG execution script connecting Retrieval and Grounded Generation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from src.generation import GenerationConfig, get_generator
from src.indexing.adapters.bge_embedder import BgeM3Embedder
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.interface import EmbeddingConfig, VectorStoreConfig
from src.retrieval.adapters.dense_retriever import DenseRetriever


def execute_rag(
    query: str,
    provider: str | None = None,
    model_name: str | None = None,
    base_url: str | None = None,
    api_key: str | None = None,
    collection_name: str = "rag_documents_ioh",
    top_k: int = 3,
    threshold: float | None = None,
    persist_dir: Path | None = None,
    output_json: bool = False,
) -> int:
    """Execute complete end-to-end RAG pipeline: retrieval + grounded generation."""
    # 1. Setup Retrieval Subsystem
    store_path = persist_dir or Path("data/vector_store/chroma")
    store_config = VectorStoreConfig(
        persist_directory=store_path,
        collection_name=collection_name,
    )
    store = ChromaVectorStore(config=store_config)
    emb_config = EmbeddingConfig(model_name="BAAI/bge-m3")
    embedder = BgeM3Embedder(config=emb_config)
    retriever = DenseRetriever(embedder=embedder, vector_store=store)

    # 2. Retrieve Context
    context = retriever.retrieve(query=query, top_k=top_k, score_threshold=threshold)

    # 3. Resolve Generator Configuration
    config = GenerationConfig.from_env(
        provider=provider,
        model_name=model_name,
        base_url=base_url,
        api_key=api_key,
    )
    generator = get_generator(config)

    # 4. Generate Grounded Response
    result = generator.generate(query=query, context=context)

    # 5. Output Results
    if output_json:
        payload = {
            "query": result.query,
            "answer": result.answer,
            "has_sufficient_context": result.has_sufficient_context,
            "citations": [
                {
                    "document_id": c.document_id,
                    "chunk_id": c.chunk_id,
                    "relevance_score": round(c.relevance_score, 4),
                    "reference_snippet": c.reference_snippet,
                }
                for c in result.citations
            ],
        }
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print("=" * 70)
        print(f"QUERY: {result.query}")
        print("=" * 70)
        print(f"ANSWER:\n{result.answer}\n")
        print(f"Sufficient Context: {result.has_sufficient_context}")
        print(f"Citations ({len(result.citations)}):")
        for i, c in enumerate(result.citations, start=1):
            print(f"  [{i}] Doc: {c.document_id} | Chunk: {c.chunk_id} | Score: {c.relevance_score:.4f}")
            print(f"      Snippet: {c.reference_snippet}")
        print("=" * 70)

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run End-to-End Grounded RAG Pipeline")
    parser.add_argument("--query", "-q", required=True, help="Natural language user query")
    parser.add_argument("--provider", "-p", default=None, help="LLM provider ('openai' or 'anthropic')")
    parser.add_argument("--model", "-m", default=None, help="Target LLM model name")
    parser.add_argument("--base-url", default=None, help="Custom API base URL (e.g. Sumopod gateway)")
    parser.add_argument("--api-key", default=None, help="API key token")
    parser.add_argument("--collection", "-c", default="rag_documents_ioh", help="Chroma collection name")
    parser.add_argument("--top-k", "-k", type=int, default=3, help="Number of chunks to retrieve")
    parser.add_argument("--threshold", "-t", type=float, default=None, help="Minimum score threshold")
    parser.add_argument("--persist-dir", default=None, help="Path to ChromaDB persistence directory")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()
    persist_dir = Path(args.persist_dir) if args.persist_dir else None

    sys.exit(
        execute_rag(
            query=args.query,
            provider=args.provider,
            model_name=args.model,
            base_url=args.base_url,
            api_key=args.api_key,
            collection_name=args.collection,
            top_k=args.top_k,
            threshold=args.threshold,
            persist_dir=persist_dir,
            output_json=args.json,
        )
    )
