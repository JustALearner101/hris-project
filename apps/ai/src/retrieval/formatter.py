"""Context formatting utility for prompt context assembly and citation attribution."""

from __future__ import annotations

from typing import Any, Sequence

from src.retrieval.interface import FormattedContext, RetrievalResult


class ContextFormatter:
    """Formats retrieved context chunks into standardized prompt context blocks with numbered citations."""

    @staticmethod
    def format(
        results: Sequence[RetrievalResult],
        include_scores: bool = True,
    ) -> FormattedContext:
        """Render results into a prompt-ready formatted context block and citation dictionary list.

        Format example:
            [1] [Source: /data/raw/report.pdf | Chunk: doc_test#c0001 | Page: 2 | Score: 0.8921]
            Artificial intelligence transforms software development by accelerating code generation.

            [2] ...
        """
        if not results:
            return FormattedContext(context_text="", citations=[])

        text_blocks: list[str] = []
        citations: list[dict[str, Any]] = []

        for idx, item in enumerate(results, start=1):
            chunk = item.chunk
            page_str = str(chunk.page_number) if chunk.page_number is not None else "-"
            source_file = (
                chunk.metadata.get("source_path")
                or chunk.metadata.get("file_name")
                or chunk.document_id
            )

            if include_scores:
                header = (
                    f"[{idx}] [Source: {source_file} | Chunk: {chunk.chunk_id} | "
                    f"Page: {page_str} | Score: {item.score:.4f}]"
                )
            else:
                header = (
                    f"[{idx}] [Source: {source_file} | Chunk: {chunk.chunk_id} | "
                    f"Page: {page_str}]"
                )

            text_blocks.append(f"{header}\n{chunk.text.strip()}")

            citations.append({
                "citation_index": idx,
                "chunk_id": chunk.chunk_id,
                "document_id": chunk.document_id,
                "page_number": chunk.page_number,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
                "score": item.score,
                "source_path": chunk.metadata.get("source_path"),
            })

        formatted_text = "\n\n".join(text_blocks)
        return FormattedContext(context_text=formatted_text, citations=citations)
