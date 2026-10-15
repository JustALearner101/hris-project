"""Concrete adapter for embedded vector storage using ChromaDB."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Sequence

import chromadb

from src.indexing.exceptions import VectorStoreError
from src.indexing.interface import BaseVectorStore, DocumentChunk, VectorStoreConfig

logger = logging.getLogger(__name__)

RESERVED_LINEAGE_KEYS = {
    "document_id",
    "chunk_index",
    "char_start",
    "char_end",
    "created_at",
    "created_by",
    "page_number",
}


class ChromaVectorStore(BaseVectorStore):
    """Local embedded vector store adapter backed by ChromaDB PersistentClient."""

    def __init__(self, config: VectorStoreConfig | None = None) -> None:
        self.config = config or VectorStoreConfig()
        self.persist_directory = self.config.persist_directory
        self.persist_directory.mkdir(parents=True, exist_ok=True)

        logger.info(
            "Initializing ChromaDB PersistentClient at %s (collection=%s, metric=%s)",
            self.persist_directory,
            self.config.collection_name,
            self.config.distance_metric,
        )

        try:
            self.client = chromadb.PersistentClient(path=str(self.persist_directory))
            self.collection = self.client.get_or_create_collection(
                name=self.config.collection_name,
                metadata={"hnsw:space": self.config.distance_metric},
            )
        except Exception as exc:
            raise VectorStoreError(
                f"Failed to initialize ChromaDB collection '{self.config.collection_name}' at '{self.persist_directory}': {exc}"
            ) from exc

    def _serialize_metadata(self, chunk: DocumentChunk) -> dict[str, str | int | float | bool]:
        """Convert DocumentChunk metadata and lineage fields into Chroma-compatible scalar primitives."""
        serialized: dict[str, str | int | float | bool] = {
            "document_id": chunk.document_id,
            "chunk_index": chunk.chunk_index,
            "char_start": chunk.char_start,
            "char_end": chunk.char_end,
            "created_at": chunk.created_at,
            "created_by": chunk.created_by,
            "page_number": chunk.page_number if chunk.page_number is not None else -1,
        }

        # Process arbitrary chunk metadata
        for key, value in chunk.metadata.items():
            if value is None:
                continue
            if isinstance(value, (str, int, float, bool)):
                if key not in serialized:
                    serialized[key] = value
            elif isinstance(value, (list, dict)):
                json_key = key if key.endswith("_json") else f"{key}_json"
                serialized[json_key] = json.dumps(value, ensure_ascii=False)
            else:
                serialized[key] = str(value)

        return serialized

    def _deserialize_chunk(
        self,
        chunk_id: str,
        text: str,
        metadata: dict[str, Any] | None,
    ) -> DocumentChunk:
        """Reconstruct a domain DocumentChunk from Chroma storage record."""
        meta = metadata or {}

        document_id = str(meta.get("document_id", ""))
        chunk_index = int(meta.get("chunk_index", 0))
        char_start = int(meta.get("char_start", 0))
        char_end = int(meta.get("char_end", 0))
        created_at = str(meta.get("created_at", ""))
        created_by = str(meta.get("created_by", "system"))

        raw_page = meta.get("page_number", -1)
        page_number = None if raw_page is None or raw_page == -1 else int(raw_page)

        custom_metadata: dict[str, Any] = {}
        for key, value in meta.items():
            if key in RESERVED_LINEAGE_KEYS:
                continue
            if key.endswith("_json") and isinstance(value, str):
                orig_key = key[:-5]
                try:
                    custom_metadata[orig_key] = json.loads(value)
                except Exception:
                    custom_metadata[key] = value
            else:
                custom_metadata[key] = value

        return DocumentChunk(
            chunk_id=chunk_id,
            document_id=document_id,
            chunk_index=chunk_index,
            text=text,
            char_start=char_start,
            char_end=char_end,
            created_at=created_at,
            created_by=created_by,
            page_number=page_number,
            metadata=custom_metadata,
        )

    def add_chunks(
        self,
        chunks: Sequence[DocumentChunk],
        embeddings: Sequence[Sequence[float]],
    ) -> None:
        """Persist document chunks and their associated embedding vectors via idempotent upsert."""
        if not chunks:
            return

        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatched counts: got {len(chunks)} chunks and {len(embeddings)} embeddings."
            )

        ids = [chunk.chunk_id for chunk in chunks]
        documents = [chunk.text for chunk in chunks]
        metadatas = [self._serialize_metadata(chunk) for chunk in chunks]
        embeddings_list = [[float(v) for v in emb] for emb in embeddings]

        try:
            self.collection.upsert(
                ids=ids,
                documents=documents,
                embeddings=embeddings_list,
                metadatas=metadatas,
            )
            logger.info("Successfully upserted %d chunks to collection '%s'", len(chunks), self.config.collection_name)
        except Exception as exc:
            raise VectorStoreError(
                f"Failed to upsert chunks into Chroma collection '{self.config.collection_name}': {exc}"
            ) from exc

    def similarity_search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 5,
        where: dict[str, Any] | None = None,
    ) -> Sequence[tuple[DocumentChunk, float]]:
        """Query top-k most similar document chunks, returning normalized cosine similarity scores in [0.0, 1.0]."""
        if top_k <= 0:
            return []

        try:
            total_items = self.collection.count()
            if total_items == 0:
                return []

            query_vector = [float(v) for v in query_embedding]
            query_kwargs: dict[str, Any] = {
                "query_embeddings": [query_vector],
                "n_results": min(top_k, total_items),
                "include": ["documents", "metadatas", "distances"],
            }
            if where is not None:
                query_kwargs["where"] = where

            response = self.collection.query(**query_kwargs)
        except Exception as exc:
            raise VectorStoreError(f"ChromaDB similarity search query failed: {exc}") from exc

        ids_list = response.get("ids", [[]])
        if not ids_list or not ids_list[0]:
            return []

        ids = ids_list[0]
        documents = response.get("documents", [[]])[0]
        metadatas = response.get("metadatas", [[]])[0]
        distances = response.get("distances", [[]])[0]

        results: list[tuple[DocumentChunk, float]] = []
        for chunk_id, text, metadata, distance in zip(ids, documents, metadatas, distances):
            # Chroma returns cosine distance d = 1 - cos_sim.
            # Normalize to similarity score S = max(0.0, min(1.0, 1.0 - d))
            sim_score = max(0.0, min(1.0, 1.0 - float(distance)))
            chunk = self._deserialize_chunk(chunk_id=chunk_id, text=text, metadata=metadata)
            results.append((chunk, sim_score))

        # Sort descending by similarity score
        results.sort(key=lambda item: item[1], reverse=True)
        return results[:top_k]
