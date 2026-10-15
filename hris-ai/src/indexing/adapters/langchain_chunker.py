"""LangChain recursive character text chunker adapter."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Sequence

from langchain_text_splitters import RecursiveCharacterTextSplitter

from src.indexing.interface import BaseChunker, ChunkingConfig, DocumentChunk
from src.ingestion.adapters.text_loader import get_current_utc_timestamp
from src.ingestion.interface import Document


def _resolve_page_number(char_start: int, page_spans: list[tuple[int, int, int]]) -> int | None:
    """Resolve the page number for a given character start position."""
    for start, end, page_num in page_spans:
        if start <= char_start <= end:
            return page_num
    # If falling in the boundary separator or beyond, pick the nearest prior page
    for start, end, page_num in reversed(page_spans):
        if char_start >= start:
            return page_num
    return page_spans[0][2] if page_spans else None


def _build_page_spans(document: Document) -> list[tuple[int, int, int]]:
    """Build character ranges for each page if multi-page metadata is present."""
    pages_meta = document.metadata.get("pages")
    if not isinstance(pages_meta, list) or not pages_meta:
        return []

    spans: list[tuple[int, int, int]] = []
    curr = 0
    for page_entry in pages_meta:
        if not isinstance(page_entry, dict):
            continue
        page_num = page_entry.get("page_number", len(spans) + 1)
        p_len = page_entry.get("character_length", 0)
        spans.append((curr, curr + p_len, page_num))
        curr += p_len + 2  # Separator '\n\n' between pages

    return spans


class LangChainRecursiveChunker(BaseChunker):
    """Adapter wrapping LangChain's RecursiveCharacterTextSplitter with lineage and audit propagation."""

    def chunk_document(
        self,
        document: Document,
        config: ChunkingConfig | None = None,
        actor: str = "system",
    ) -> Sequence[DocumentChunk]:
        """Split a single document into sequential, overlapping chunks with lineage and offsets."""
        cfg = config or ChunkingConfig()

        if not document.content or not document.content.strip():
            return []

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=cfg.chunk_size,
            chunk_overlap=cfg.chunk_overlap,
            separators=list(cfg.separators),
            keep_separator=cfg.keep_separator,
        )

        raw_chunks = splitter.split_text(document.content)
        if not raw_chunks and document.content:
            raw_chunks = [document.content]

        page_spans = _build_page_spans(document)
        now_ts = get_current_utc_timestamp()

        chunks: list[DocumentChunk] = []
        cursor = 0
        prev_len = 0

        for idx, chunk_text in enumerate(raw_chunks):
            # Calculate search start allowing for overlap lookback
            search_start = max(0, cursor + prev_len - cfg.chunk_overlap)
            char_start = document.content.find(chunk_text, search_start)
            if char_start == -1:
                # Failsafe fallback to search from beginning
                char_start = document.content.find(chunk_text)
            if char_start == -1:
                char_start = 0

            char_end = char_start + len(chunk_text)
            cursor = char_start
            prev_len = len(chunk_text)

            page_num = _resolve_page_number(char_start, page_spans) if page_spans else None
            chunk_id = f"{document.id}#c{idx:04d}"

            chunk_metadata: dict[str, Any] = {
                "source_path": document.source_path,
                "file_type": document.file_type,
                "parent_content_hash": document.content_hash,
                **document.metadata,
            }
            if page_num is not None:
                chunk_metadata["page_number"] = page_num

            chunks.append(
                DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=document.id,
                    chunk_index=idx,
                    text=chunk_text,
                    char_start=char_start,
                    char_end=char_end,
                    created_at=now_ts,
                    created_by=actor,
                    page_number=page_num,
                    metadata=chunk_metadata,
                )
            )

        return chunks

    def chunk_documents(
        self,
        documents: Sequence[Document],
        config: ChunkingConfig | None = None,
        actor: str = "system",
    ) -> Sequence[DocumentChunk]:
        """Split a collection of documents into sequential chunks."""
        all_chunks: list[DocumentChunk] = []
        for doc in documents:
            all_chunks.extend(self.chunk_document(doc, config=config, actor=actor))
        return all_chunks
