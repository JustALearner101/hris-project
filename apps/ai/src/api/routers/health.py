"""Health router reporting system and vector store status."""

from pathlib import Path
from fastapi import APIRouter
from src.api.schemas import HealthResponse
from src.indexing.adapters.chroma_store import ChromaVectorStore
from src.indexing.interface import VectorStoreConfig

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def get_health(collection: str = "rag_documents_ioh") -> HealthResponse:
    """Check system health and return indexed chunk count."""
    persist_dir = Path("data/vector_store/chroma")
    indexed_chunks = 0
    try:
        if persist_dir.exists():
            store_config = VectorStoreConfig(
                persist_directory=persist_dir,
                collection_name=collection,
            )
            store = ChromaVectorStore(config=store_config)
            indexed_chunks = store.collection.count()
    except Exception:
        indexed_chunks = 0

    return HealthResponse(
        status="ok",
        collection=collection,
        indexed_chunks=indexed_chunks,
    )
