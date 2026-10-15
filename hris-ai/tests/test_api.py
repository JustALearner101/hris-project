"""Unit and contract tests for FastAPI endpoints."""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.retrieval.interface import RetrievalResult
from src.indexing.interface import DocumentChunk

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /api/health returns valid schema and status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "collection" in data
    assert "indexed_chunks" in data
    assert isinstance(data["indexed_chunks"], int)


def test_chat_validation_empty_query():
    """Verify POST /api/chat rejects empty query with 422."""
    response = client.post("/api/chat", json={"query": ""})
    assert response.status_code == 422


def test_chat_validation_invalid_top_k():
    """Verify POST /api/chat rejects top_k out of bounds."""
    response = client.post("/api/chat", json={"query": "test", "top_k": 50})
    assert response.status_code == 422


def test_chat_stream_mocked():
    """Verify POST /api/chat streams SSE events (metadata, delta, done)."""
    mock_chunk = DocumentChunk(
        chunk_id="chunk_001",
        document_id="doc_hr_01",
        chunk_index=0,
        text="Hak cuti tahunan adalah 12 hari kerja per tahun.",
        char_start=0,
        char_end=45,
        created_at="2026-10-05T00:00:00Z",
        metadata={"file_name": "DOC_HR_CUTI.pdf"},
    )
    mock_retrieval_result = RetrievalResult(chunk=mock_chunk, score=0.85, rank=1)

    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value = [mock_retrieval_result]

    mock_generator = MagicMock()
    mock_generator.generate_stream.return_value = iter(["Karyawan ", "berhak ", "12 hari cuti [1]."])

    with patch("src.api.routers.chat.get_dependencies", return_value=(mock_retriever, mock_generator)):
        response = client.post(
            "/api/chat",
            json={"query": "Berapa cuti tahunan?"},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        body = response.text
        assert "event: metadata" in body
        assert "event: delta" in body
        assert "event: done" in body
        assert "DOC_HR_CUTI.pdf" in body
        assert "12 hari cuti" in body


def test_chat_stream_abstention_mocked():
    """Verify POST /api/chat streams refusal when context is empty."""
    mock_retriever = MagicMock()
    mock_retriever.retrieve.return_value = []

    mock_generator = MagicMock()

    with patch("src.api.routers.chat.get_dependencies", return_value=(mock_retriever, mock_generator)):
        response = client.post(
            "/api/chat",
            json={"query": "Resep nasi goreng?"},
        )
        assert response.status_code == 200
        body = response.text
        assert "event: metadata" in body
        assert "event: delta" in body
        assert "has_sufficient_context\": false" in body
