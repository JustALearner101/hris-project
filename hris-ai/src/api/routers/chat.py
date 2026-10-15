"""Chat router streaming RAG responses and citation metadata via SSE."""

import json
import logging
from pathlib import Path
from typing import AsyncIterator, Sequence

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from src.api.schemas import ChatRequest, CitationSourceSchema
from src.generation.citation import DEFAULT_ABSTENTION_MESSAGE_ID, SENTINEL_INSUFFICIENT_CONTEXT
from src.generation.factory import get_generator
from src.indexing.adapters.bge_embedder import BgeM3Embedder
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.interface import EmbeddingConfig, VectorStoreConfig
from src.retrieval.adapters.dense_retriever import DenseRetriever
from src.retrieval.interface import RetrievalResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])

# Module-level singletons for cache and fast response
_embedder = None
_vector_store = None
_retriever = None
_generator = None

CONVERSATIONAL_GREETINGS = {
    "hey", "hi", "halo", "hello", "hei", "helo",
    "pagi", "selamat pagi", "siang", "selamat siang",
    "sore", "selamat sore", "malam", "selamat malam",
    "assalamualaikum", "assalamu'alaikum", "tes", "test", "ping",
    "siapa kamu", "kamu siapa", "who are you",
    "bantu saya", "tolong", "help",
}


def is_greeting(text: str) -> bool:
    """Check if the input query is a conversational greeting or greeting opener."""
    cleaned = text.strip().lower().rstrip("!?.")
    return cleaned in CONVERSATIONAL_GREETINGS


def get_dependencies():
    """Lazily load and reuse RAG pipeline singletons."""
    global _embedder, _vector_store, _retriever, _generator
    if _embedder is None:
        emb_config = EmbeddingConfig(model_name="BAAI/bge-m3")
        _embedder = BgeM3Embedder(config=emb_config)
    if _vector_store is None:
        persist_dir = Path("data/vector_store/chroma")
        store_config = VectorStoreConfig(
            persist_directory=persist_dir,
            collection_name="rag_documents_ioh",
        )
        _vector_store = ChromaVectorStore(config=store_config)
    if _retriever is None:
        _retriever = DenseRetriever(vector_store=_vector_store, embedder=_embedder)
    if _generator is None:
        _generator = get_generator()
    return _retriever, _generator


@router.post("/chat")
async def chat_stream_endpoint(request: ChatRequest) -> EventSourceResponse:
    """Stream grounded RAG tokens and citation metadata using Server-Sent Events."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query string must not be empty.")

    try:
        retriever, generator = get_dependencies()
    except Exception as exc:
        logger.error(f"Failed to initialize RAG dependencies: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline initialization failed: {exc}")

    async def event_generator() -> AsyncIterator[dict]:
        try:
            # Check for conversational greeting opener
            if is_greeting(request.query):
                yield {
                    "event": "metadata",
                    "data": json.dumps({"type": "metadata", "sources": []}),
                }
                greeting_reply = (
                    "Halo! Saya adalah **IOH Knowledge Assistant**. Saya siap membantu Anda "
                    "menemukan informasi dan menjawab pertanyaan seputar SOP, kebijakan SDM, "
                    "tata kelola IT, teknik jaringan, dan dokumen internal PT Indosat Ooredoo Hutchison Tbk.\n\n"
                    "Ada yang bisa saya bantu hari ini?"
                )
                yield {
                    "event": "delta",
                    "data": json.dumps({"type": "delta", "content": greeting_reply}),
                }
                yield {
                    "event": "done",
                    "data": json.dumps(
                        {"type": "done", "has_sufficient_context": True, "total_citations": 0}
                    ),
                }
                return

            # 1. Retrieve relevant chunks
            retrieved_chunks: Sequence[RetrievalResult] = retriever.retrieve(
                query=request.query,
                top_k=request.top_k,
                score_threshold=request.threshold,
            )

            # 2. Build citation metadata
            sources = []
            for idx, item in enumerate(retrieved_chunks):
                doc_title = item.chunk.metadata.get("file_name") or item.chunk.document_id
                sources.append(
                    CitationSourceSchema(
                        citationIndex=idx + 1,
                        docId=item.chunk.document_id,
                        documentTitle=doc_title,
                        chunkId=item.chunk.chunk_id,
                        snippet=item.chunk.text,
                        score=round(item.score, 4),
                    ).model_dump()
                )

            # Send metadata event first
            yield {
                "event": "metadata",
                "data": json.dumps({"type": "metadata", "sources": sources}),
            }

            # If no context found, abstain immediately
            if not retrieved_chunks:
                yield {
                    "event": "delta",
                    "data": json.dumps({"type": "delta", "content": DEFAULT_ABSTENTION_MESSAGE_ID}),
                }
                yield {
                    "event": "done",
                    "data": json.dumps(
                        {"type": "done", "has_sufficient_context": False, "total_citations": 0}
                    ),
                }
                return

            # 3. Stream LLM tokens
            collected_text = ""
            is_abstaining = False

            token_stream = generator.generate_stream(request.query, retrieved_chunks)
            for token in token_stream:
                collected_text += token
                if SENTINEL_INSUFFICIENT_CONTEXT in collected_text:
                    is_abstaining = True
                    break

                yield {
                    "event": "delta",
                    "data": json.dumps({"type": "delta", "content": token}),
                }

            if is_abstaining:
                # If sentinel detected, emit refusal message
                yield {
                    "event": "delta",
                    "data": json.dumps({"type": "delta", "content": DEFAULT_ABSTENTION_MESSAGE_ID}),
                }
                yield {
                    "event": "done",
                    "data": json.dumps(
                        {"type": "done", "has_sufficient_context": False, "total_citations": 0}
                    ),
                }
            else:
                yield {
                    "event": "done",
                    "data": json.dumps(
                        {"type": "done", "has_sufficient_context": True, "total_citations": len(sources)}
                    ),
                }

        except Exception as err:
            logger.error(f"Error during SSE generation stream: {err}", exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"type": "error", "message": str(err)}),
            }

    return EventSourceResponse(event_generator())
