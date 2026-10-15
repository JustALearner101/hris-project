"""Automated end-to-end evaluation runner across all test cases."""

from __future__ import annotations

import argparse
import json
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

from src.generation import GenerationConfig, get_generator
from src.indexing.adapters.bge_embedder import BgeM3Embedder
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.interface import EmbeddingConfig, VectorStoreConfig
from src.retrieval.adapters.dense_retriever import DenseRetriever


def run_evaluation(
    test_cases_path: Path = Path("evaluation/test_cases.json"),
    collection_name: str = "rag_documents_ioh",
    persist_dir: Path = Path("data/vector_store/chroma"),
    top_k: int = 3,
    threshold: float | None = None,
    output_report: Path = Path("evaluation/evaluation_results.json"),
) -> int:
    """Run end-to-end RAG pipeline across test cases and generate an evaluation summary."""
    print("=" * 80)
    print("IOH-RAG-POC: End-to-End Evaluation Runner")
    print("=" * 80)

    if not test_cases_path.exists():
        print(f"[ERROR] Test cases file not found: {test_cases_path}", file=sys.stderr)
        return 1

    with open(test_cases_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    print(f"\n[1/3] Initializing pipeline with collection '{collection_name}'...")
    store_config = VectorStoreConfig(
        persist_directory=persist_dir,
        collection_name=collection_name,
    )
    store = ChromaVectorStore(config=store_config)
    total_chunks = store.collection.count()
    print(f"  -> Total indexed chunks in collection: {total_chunks}")
    if total_chunks == 0:
        print(
            f"[ERROR] Collection '{collection_name}' is empty. Run scripts/index_all_documents.py first!",
            file=sys.stderr,
        )
        return 1

    emb_config = EmbeddingConfig(model_name="BAAI/bge-m3")
    embedder = BgeM3Embedder(config=emb_config)
    retriever = DenseRetriever(embedder=embedder, vector_store=store)

    config = GenerationConfig.from_env()
    print(f"  -> LLM Provider: {config.provider} | Model: {config.model_name} | Base URL: {config.base_url}")
    generator = get_generator(config)

    print(f"\n[2/3] Executing {len(test_cases)} Test Cases...")
    results_summary = []

    for tc in test_cases:
        tc_id = tc.get("id")
        category = tc.get("category")
        query = tc.get("query")
        target_doc = tc.get("target_doc")
        expected_abstention = tc.get("expected_abstention", False)

        print(f"\n--------------------------------------------------------------------------------")
        print(f"[{tc_id}] Category: {category}")
        print(f"Query: {query}")

        start_time = time.time()
        # 1. Retrieve
        context = retriever.retrieve(query=query, top_k=top_k, score_threshold=threshold)
        retrieval_latency = time.time() - start_time

        # Check target doc match in top retrieved chunks
        matched_target = False
        retrieved_doc_ids = [r.chunk.document_id for r in context]
        if target_doc:
            # Check if target_doc substring appears in any retrieved document_id or metadata
            for r in context:
                source_path = str(r.chunk.metadata.get("source_path", ""))
                if target_doc.lower() in source_path.lower() or target_doc.lower() in r.chunk.document_id.lower():
                    matched_target = True
                    break

        # 2. Generate
        gen_start = time.time()
        gen_result = generator.generate(query=query, context=context)
        gen_latency = time.time() - gen_start
        total_latency = retrieval_latency + gen_latency

        # Check abstention match
        actual_abstention = not gen_result.has_sufficient_context
        abstention_match = (actual_abstention == expected_abstention)

        print(f"Answer: {gen_result.answer[:150]}..." if len(gen_result.answer) > 150 else f"Answer: {gen_result.answer}")
        print(f"Sufficient Context: {gen_result.has_sufficient_context} (Expected Abstain: {expected_abstention})")
        print(f"Citations: {len(gen_result.citations)} | Latency: {total_latency:.2f}s (Retrieval: {retrieval_latency:.2f}s, Gen: {gen_latency:.2f}s)")
        if target_doc:
            print(f"Target Doc Retrieved: {'YES' if matched_target else 'NO'} ({target_doc})")

        case_result = {
            "id": tc_id,
            "category": category,
            "query": query,
            "target_doc": target_doc,
            "target_matched": matched_target if target_doc else None,
            "expected_abstention": expected_abstention,
            "actual_abstention": actual_abstention,
            "abstention_match": abstention_match,
            "answer": gen_result.answer,
            "citations_count": len(gen_result.citations),
            "citations": [
                {
                    "doc_id": c.document_id,
                    "chunk_id": c.chunk_id,
                    "score": round(c.relevance_score, 4),
                    "snippet": c.reference_snippet,
                }
                for c in gen_result.citations
            ],
            "retrieval_latency_sec": round(retrieval_latency, 3),
            "generation_latency_sec": round(gen_latency, 3),
            "total_latency_sec": round(total_latency, 3),
        }
        results_summary.append(case_result)

    # 3. Print Evaluation Summary Table
    print("\n" + "=" * 80)
    print("[3/3] EVALUATION SUMMARY REPORT")
    print("=" * 80)

    header = f"| {'ID':<6} | {'Category':<22} | {'Target Match':<12} | {'Abstain Match':<13} | {'Citations':<9} | {'Latency':<8} |"
    divider = f"|{'-'*8}|{'-'*24}|{'-'*14}|{'-'*15}|{'-'*11}|{'-'*10}|"
    print(header)
    print(divider)

    total_abstention_matches = 0
    total_target_matches = 0
    evaluable_targets = 0

    for r in results_summary:
        tgt_str = "N/A (OOD)" if r["target_matched"] is None else ("PASS" if r["target_matched"] else "MISS")
        abs_str = "PASS" if r["abstention_match"] else "FAIL"
        lat_str = f"{r['total_latency_sec']:.2f}s"
        cit_str = str(r["citations_count"])

        if r["abstention_match"]:
            total_abstention_matches += 1
        if r["target_matched"] is not None:
            evaluable_targets += 1
            if r["target_matched"]:
                total_target_matches += 1

        print(f"| {r['id']:<6} | {r['category'][:22]:<22} | {tgt_str:<12} | {abs_str:<13} | {cit_str:<9} | {lat_str:<8} |")

    print(divider)
    target_accuracy = (total_target_matches / evaluable_targets * 100) if evaluable_targets > 0 else 100.0
    abstention_accuracy = (total_abstention_matches / len(results_summary) * 100)
    print(f"\nTarget Retrieval Accuracy: {total_target_matches}/{evaluable_targets} ({target_accuracy:.1f}%)")
    print(f"Abstention Accuracy:       {total_abstention_matches}/{len(results_summary)} ({abstention_accuracy:.1f}%)")

    # Save to JSON
    with open(output_report, "w", encoding="utf-8") as f:
        json.dump(
            {
                "metrics": {
                    "total_cases": len(results_summary),
                    "target_accuracy_pct": target_accuracy,
                    "abstention_accuracy_pct": abstention_accuracy,
                },
                "results": results_summary,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )
    print(f"Detailed JSON results saved to: {output_report}")
    print("=" * 80)

    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run End-to-End RAG Evaluation")
    parser.add_argument("--test-cases", default="evaluation/test_cases.json", help="Path to test cases JSON")
    parser.add_argument("--collection", default="rag_documents_ioh", help="Chroma collection name")
    parser.add_argument("--top-k", type=int, default=3, help="Top-K context chunks")
    parser.add_argument("--threshold", type=float, default=None, help="Score threshold cutoff")
    parser.add_argument("--output", default="evaluation/evaluation_results.json", help="Output report path")

    args = parser.parse_args()
    sys.exit(
        run_evaluation(
            test_cases_path=Path(args.test_cases),
            collection_name=args.collection,
            top_k=args.top_k,
            threshold=args.threshold,
            output_report=Path(args.output),
        )
    )
