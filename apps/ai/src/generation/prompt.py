"""Prompt engineering and formatting utilities for grounded generation."""

from typing import Sequence

from src.retrieval.formatter import ContextFormatter
from src.retrieval.interface import RetrievalResult


SYSTEM_PROMPT_TEMPLATE = """You are the IOH Knowledge Assistant, an accurate, truth-grounded enterprise assistant for PT Indosat Ooredoo Hutchison Tbk.
Your role is to answer questions based EXCLUSIVELY on the retrieved corporate documents, SOPs, policies, and operational guidelines provided in the context below.

STRICT OPERATING RULES:
1. GROUNDING: Rely solely on the provided context passages. Do NOT extrapolate, speculate, or incorporate outside knowledge not contained in the text.
2. CITATIONS: Attribute every factual statement or claim with bracketed numerical citation tags (e.g. [1], [2]) corresponding to the numbered context passages that support it.
3. ABSTENTION: If the user asks a factual question and the provided context does NOT contain sufficient factual evidence to answer, you MUST reply with the exact token: [INSUFFICIENT_CONTEXT]. Do not attempt to guess or hallucinate.
4. TONE & IDENTITY: Maintain a professional, helpful, and courteous tone as an internal company assistant.
5. LANGUAGE: Always respond in the same language as the user's question (e.g., Bahasa Indonesia if the question is in Indonesian, English if in English).
"""


def build_grounded_messages(
    query: str,
    context: Sequence[RetrievalResult],
) -> tuple[str, str]:
    """Construct (system_prompt, user_prompt) with strict grounding and citation instructions.

    Args:
        query: The user's input query.
        context: Sequence of retrieved context chunks.

    Returns:
        A tuple of (system_prompt, user_prompt).
    """
    if not query or not query.strip():
        raise ValueError("Query string must not be empty or whitespace.")

    # Format the context chunks into numbered blocks
    formatted_context_block = ContextFormatter.format(context)

    user_prompt = (
        f"Context information:\n"
        f"---------------------\n"
        f"{formatted_context_block}\n"
        f"---------------------\n\n"
        f"Question: {query.strip()}\n"
        f"Answer:"
    )

    return SYSTEM_PROMPT_TEMPLATE, user_prompt
