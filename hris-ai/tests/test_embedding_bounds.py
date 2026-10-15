"""Unit tests for sequence length boundary enforcement in BgeM3Embedder."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from src.indexing.exceptions import ContextLengthExceededError
from src.indexing.interface import EmbeddingConfig


def test_embed_texts_rejects_oversized_chunk() -> None:
    """Verify embed_texts rejects a document chunk exceeding max_length."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    config = EmbeddingConfig(max_length=100)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        # Return 150 tokens (> 100 max_length)
        mock_model.tokenizer.encode.return_value = list(range(150))
        mock_st.return_value = mock_model

        embedder = BgeM3Embedder(config=config)

        with pytest.raises(ContextLengthExceededError) as exc_info:
            embedder.embed_texts(["This is an oversized document chunk."])

        assert "exceeds maximum context length" in str(exc_info.value)
        assert exc_info.value.token_count == 150
        assert exc_info.value.max_length == 100
        # Assert model.encode was NEVER called to protect index fidelity
        mock_model.encode.assert_not_called()


def test_embed_texts_per_chunk_rejection_in_batch() -> None:
    """Verify embed_texts fails fast when second chunk in a batch exceeds limit."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    config = EmbeddingConfig(max_length=50)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        # First chunk 20 tokens (valid), second chunk 80 tokens (invalid)
        mock_model.tokenizer.encode.side_effect = [
            list(range(20)),
            list(range(80)),
        ]
        mock_st.return_value = mock_model

        embedder = BgeM3Embedder(config=config)

        with pytest.raises(ContextLengthExceededError) as exc_info:
            embedder.embed_texts(["Valid short chunk", "Too long chunk exceeding limit"])

        assert "chunk at index 1" in str(exc_info.value)
        assert exc_info.value.token_count == 80
        mock_model.encode.assert_not_called()


def test_embed_query_truncates_oversized_query() -> None:
    """Verify embed_query truncates oversized queries without raising ContextLengthExceededError."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    config = EmbeddingConfig(max_length=50)

    v_mock = np.ones((1, 1024), dtype=np.float32)
    v_mock /= np.linalg.norm(v_mock)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        # Query has 120 tokens
        mock_model.tokenizer.encode.side_effect = [
            list(range(120)),   # Initial check in embed_query
            list(range(50)),    # Check in embed_texts after truncation
        ]
        mock_model.tokenizer.decode.return_value = "Truncated query text"
        mock_model.encode.return_value = v_mock
        mock_st.return_value = mock_model

        embedder = BgeM3Embedder(config=config)
        vector = embedder.embed_query("Very long query string..." * 20)

        assert len(vector) == 1024
        mock_model.tokenizer.decode.assert_called_once_with(list(range(50)))
        mock_model.encode.assert_called_once()


def test_embed_query_preserves_short_query() -> None:
    """Verify embed_query does not truncate queries within length limits."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    config = EmbeddingConfig(max_length=50)

    v_mock = np.ones((1, 1024), dtype=np.float32)
    v_mock /= np.linalg.norm(v_mock)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        # Query has 10 tokens
        mock_model.tokenizer.encode.side_effect = [
            list(range(10)),
            list(range(10)),
        ]
        mock_model.encode.return_value = v_mock
        mock_st.return_value = mock_model

        embedder = BgeM3Embedder(config=config)
        vector = embedder.embed_query("Short search query")

        assert len(vector) == 1024
        mock_model.tokenizer.decode.assert_not_called()
