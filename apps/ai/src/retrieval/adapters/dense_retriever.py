"""Dense semantic retriever adapter orchestrating embedding generation and vector store search."""

from __future__ import annotations

import logging
from typing import Any, Sequence

from src.indexing.interface import BaseEmbedder, BaseVectorStore
from src.retrieval.exceptions import RetrievalError, RetrieverConfigurationError
from src.retrieval.interface import (
    BaseRetriever,
    RetrievalQuery,
    RetrievalResult,
    RetrievedContext,
)

logger = logging.getLogger(__name__)


class DenseRetriever(BaseRetriever):
    """Dense semantic retriever orchestrating embedding generation, vector store lookup,
    metadata filtering, and score thresholding.
    """

    def __init__(
        self,
        embedder: BaseEmbedder,
        vector_store: BaseVectorStore,
    ) -> None:
        """Initialize DenseRetriever with dependency-injected embedder and vector store.

        Raises:
            RetrieverConfigurationError: If embedder or vector_store is None.
        """
        if embedder is None or vector_store is None:
            raise RetrieverConfigurationError(
                "DenseRetriever requires valid BaseEmbedder and BaseVectorStore instances."
            )
        self.embedder = embedder
        self.vector_store = vector_store

    def _coerce_query(
        self,
        query: str | RetrievalQuery,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        score_threshold: float | None = None,
    ) -> RetrievalQuery:
        """Normalize query input into a validated RetrievalQuery value object."""
        if isinstance(query, RetrievalQuery):
            return query
        return RetrievalQuery(
            query_text=query,
            top_k=top_k,
            metadata_filter=where,
            score_threshold=score_threshold,
        )

    def retrieve(
        self,
        query: str | RetrievalQuery,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        score_threshold: float | None = None,
    ) -> Sequence[RetrievalResult]:
        """Execute semantic retrieval, score thresholding, and ranking.

        Empty or whitespace-only queries short-circuit immediately to an empty list ([]).
        """
        retrieval_query = self._coerce_query(
            query=query,
            top_k=top_k,
            where=where,
            score_threshold=score_threshold,
        )

        # 1. Short-circuit empty or whitespace-only queries to conserve compute
        text = retrieval_query.query_text
        if not text or not text.strip():
            logger.debug("Empty or whitespace query received; returning empty result list.")
            return []

        try:
            # 2. Compute query embedding vector
            query_embedding = self.embedder.embed_query(text.strip())

            # 3. Query vector store with metadata filtering
            raw_candidates = self.vector_store.similarity_search(
                query_embedding=query_embedding,
                top_k=retrieval_query.top_k,
                where=retrieval_query.metadata_filter,
            )

            # 4. Filter by score threshold (if configured)
            filtered_candidates: list[tuple[Any, float]] = []
            for chunk, score in raw_candidates:
                if retrieval_query.score_threshold is not None:
                    if score < retrieval_query.score_threshold:
                        continue
                filtered_candidates.append((chunk, score))

            # 5. Build 1-based ranked RetrievalResult items
            results: list[RetrievalResult] = []
            for rank_idx, (chunk, score) in enumerate(filtered_candidates, start=1):
                results.append(
                    RetrievalResult(
                        chunk=chunk,
                        score=score,
                        rank=rank_idx,
                    )
                )

            return results
        except Exception as exc:
            if isinstance(exc, RetrievalError):
                raise
            raise RetrievalError(
                f"Retrieval execution failed for query '{text[:40]}...': {exc}"
            ) from exc

    def retrieve_context(
        self,
        query: str | RetrievalQuery,
        top_k: int = 5,
        where: dict[str, Any] | None = None,
        score_threshold: float | None = None,
    ) -> RetrievedContext:
        """Execute retrieval and wrap results into an aggregated RetrievedContext container."""
        retrieval_query = self._coerce_query(
            query=query,
            top_k=top_k,
            where=where,
            score_threshold=score_threshold,
        )
        results = self.retrieve(retrieval_query)
        return RetrievedContext(
            query=retrieval_query,
            results=results,
            total_candidates_found=len(results),
        )
