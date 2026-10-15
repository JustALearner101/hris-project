"""Citation parsing, verification, and abstention extraction engine."""

import re
from typing import Sequence

from src.generation.interface import Citation
from src.retrieval.interface import RetrievalResult

SENTINEL_INSUFFICIENT_CONTEXT = "[INSUFFICIENT_CONTEXT]"

DEFAULT_ABSTENTION_MESSAGE_ID = (
    "Maaf, informasi yang dicari tidak ditemukan dalam konteks dokumen yang tersedia."
)
DEFAULT_ABSTENTION_MESSAGE_EN = (
    "I am sorry, but the provided context does not contain sufficient information to answer your question."
)


def parse_citations(
    raw_text: str,
    context: Sequence[RetrievalResult],
    query_lang: str = "id",
) -> tuple[str, list[Citation], bool]:
    """Parse in-text citation markers ([n]), detect abstention, and map to Citation objects.

    Args:
        raw_text: The raw output text produced by the LLM.
        context: Sequence of retrieved context chunks supplied to the model.
        query_lang: Language code ('id' or 'en') for localized abstention phrasing.

    Returns:
        A tuple of (clean_answer, citations, has_sufficient_context).
    """
    if not raw_text or not raw_text.strip():
        message = (
            DEFAULT_ABSTENTION_MESSAGE_ID
            if query_lang == "id"
            else DEFAULT_ABSTENTION_MESSAGE_EN
        )
        return message, [], False

    # Check for sentinel abstention token
    if SENTINEL_INSUFFICIENT_CONTEXT in raw_text:
        message = (
            DEFAULT_ABSTENTION_MESSAGE_ID
            if query_lang == "id"
            else DEFAULT_ABSTENTION_MESSAGE_EN
        )
        return message, [], False

    # Extract all [n] numerical citation markers
    pattern = re.compile(r"\[(\d+)\]")
    matches = pattern.findall(raw_text)

    citations: list[Citation] = []
    seen_chunk_ids: set[str] = set()

    for match in matches:
        idx = int(match)
        # Context list is 1-indexed in prompt ([1] -> context[0])
        if 1 <= idx <= len(context):
            candidate = context[idx - 1]
            chunk_id = candidate.chunk.chunk_id
            if chunk_id not in seen_chunk_ids:
                seen_chunk_ids.add(chunk_id)
                # Take up to 200 chars as reference snippet
                snippet = (
                    candidate.chunk.text[:200] + "..."
                    if len(candidate.chunk.text) > 200
                    else candidate.chunk.text
                )
                citations.append(
                    Citation(
                        document_id=candidate.chunk.document_id,
                        chunk_id=chunk_id,
                        relevance_score=candidate.score,
                        reference_snippet=snippet,
                    )
                )

    return raw_text.strip(), citations, True
