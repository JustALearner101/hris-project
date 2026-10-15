"""Pydantic schemas for the FastAPI backend service."""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request payload for /api/chat."""

    query: str = Field(..., min_length=1, max_length=2000, description="Natural language question")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of context chunks to retrieve")
    threshold: float = Field(default=0.3, ge=0.0, le=1.0, description="Minimum cosine similarity score")
    collection: str = Field(default="rag_documents_ioh", description="Target vector collection name")


class CitationSourceSchema(BaseModel):
    """Schema representing an attributable source context chunk."""

    citationIndex: int = Field(..., description="1-based citation index corresponding to [N]")
    docId: str = Field(..., description="Unique document ID")
    documentTitle: str = Field(..., description="Human-readable document file name")
    chunkId: str = Field(..., description="Specific chunk ID")
    snippet: str = Field(..., description="Verbatim text passage excerpt")
    score: float = Field(..., description="Cosine similarity score")


class HealthResponse(BaseModel):
    """Schema for /api/health response."""

    status: str = Field(default="ok")
    collection: str = Field(default="rag_documents_ioh")
    indexed_chunks: int = Field(default=0)
