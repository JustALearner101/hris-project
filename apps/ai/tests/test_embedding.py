"""Unit tests for BgeM3Embedder and EmbeddingConfig."""

from __future__ import annotations

import math
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.indexing.exceptions import ContextLengthExceededError, ModelLoadError
from src.indexing.interface import EmbeddingConfig


def test_embedding_config_defaults() -> None:
    """Verify default parameters for EmbeddingConfig."""
    config = EmbeddingConfig()
    assert config.model_name == "BAAI/bge-m3"
    assert config.cache_folder == Path("data/cache/models")
    assert config.batch_size == 16
    assert config.device is None
    assert config.normalize_embeddings is True
    assert config.max_length == 8192


def test_embedding_config_validation() -> None:
    """Verify validation constraints on EmbeddingConfig parameters."""
    with pytest.raises(ValueError, match="model_name cannot be empty"):
        EmbeddingConfig(model_name="   ")

    with pytest.raises(ValueError, match="batch_size must be positive"):
        EmbeddingConfig(batch_size=0)

    with pytest.raises(ValueError, match="max_length must be positive"):
        EmbeddingConfig(max_length=-1)


def test_embedder_model_load_failure() -> None:
    """Verify ModelLoadError is raised when model loading fails."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer", side_effect=RuntimeError("Download failed")):
        with pytest.raises(ModelLoadError, match="Failed to load embedding model"):
            BgeM3Embedder()


def test_embedder_cache_dir_env_override(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify MODEL_CACHE_DIR environment variable takes precedence."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    override_dir = tmp_path / "custom_cache"
    monkeypatch.setenv("MODEL_CACHE_DIR", str(override_dir))

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        mock_st.return_value = mock_model
        embedder = BgeM3Embedder()

        assert embedder.cache_folder == override_dir
        mock_st.assert_called_once_with(
            model_name_or_path="BAAI/bge-m3",
            cache_folder=str(override_dir),
            device=embedder.device,
        )


def test_embed_texts_empty_list() -> None:
    """Verify embedding an empty list of texts returns an empty list."""
    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer"):
        embedder = BgeM3Embedder()
        results = embedder.embed_texts([])
        assert results == []


def test_embed_texts_dimensionality_and_normalization() -> None:
    """Verify output vectors have 1024 dimensions and unit norm length."""
    import numpy as np

    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    # Synthetic 1024-dim vectors
    v1 = np.ones(1024, dtype=np.float32)
    v1 /= np.linalg.norm(v1)
    v2 = np.ones(1024, dtype=np.float32) * 2.0
    v2 /= np.linalg.norm(v2)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        mock_model.tokenizer.encode.return_value = [1, 2, 3]
        mock_model.encode.return_value = np.array([v1, v2])
        mock_st.return_value = mock_model

        embedder = BgeM3Embedder()
        texts = ["Text one", "Text two"]
        vectors = embedder.embed_texts(texts)

        assert len(vectors) == 2
        for vec in vectors:
            assert len(vec) == 1024
            # Verify unit normalization: norm == 1.0
            norm = math.sqrt(sum(x * x for x in vec))
            assert math.isclose(norm, 1.0, rel_tol=1e-5)
            # Ensure native Python float, not numpy types
            assert isinstance(vec[0], float)


def test_multilingual_semantic_similarity_mock() -> None:
    """Verify semantic similarity calculation for English/Indonesian pairs and control."""
    import numpy as np

    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    # Construct vectors with controlled cosine similarities
    # v_en and v_id share high similarity (> 0.70), v_unrelated is orthogonal (< 0.35)
    v_base = np.zeros(1024, dtype=np.float32)
    v_base[0:800] = 1.0
    v_en = v_base / np.linalg.norm(v_base)

    v_id = np.zeros(1024, dtype=np.float32)
    v_id[0:750] = 1.0
    v_id[800:850] = 1.0
    v_id = v_id / np.linalg.norm(v_id)

    v_unrelated = np.zeros(1024, dtype=np.float32)
    v_unrelated[850:1024] = 1.0
    v_unrelated = v_unrelated / np.linalg.norm(v_unrelated)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st:
        mock_model = MagicMock()
        mock_model.tokenizer.encode.return_value = [10, 20]
        mock_model.encode.return_value = np.array([v_en, v_id, v_unrelated])
        mock_st.return_value = mock_model

        embedder = BgeM3Embedder()
        texts = [
            "The quick brown fox jumps over the lazy dog.",
            "Rubah cokelat yang lincah melompati anjing yang malas.",
            "Komputasi awan dan basis data terdistribusi memerlukan sinkronisasi tinggi.",
        ]
        vectors = embedder.embed_texts(texts)

        dot_match = sum(a * b for a, b in zip(vectors[0], vectors[1]))
        dot_unrelated = sum(a * b for a, b in zip(vectors[0], vectors[2]))

        assert dot_match >= 0.70
        assert dot_unrelated <= 0.35


def test_cuda_oom_fallback_to_cpu() -> None:
    """Verify CUDA OOM triggers fallback to CPU execution."""
    import numpy as np

    from src.indexing.adapters.bge_embedder import BgeM3Embedder

    v_mock = np.ones((1, 1024), dtype=np.float32)
    v_mock /= np.linalg.norm(v_mock)

    with patch("src.indexing.adapters.bge_embedder.SentenceTransformer") as mock_st, \
         patch("src.indexing.adapters.bge_embedder.torch") as mock_torch:
        mock_model = MagicMock()
        mock_model.tokenizer.encode.return_value = [1, 2]
        # First call on CUDA raises OOM, second call on CPU succeeds
        mock_model.encode.side_effect = [
            RuntimeError("CUDA out of memory. Tried to allocate 2.00 GiB"),
            v_mock,
        ]
        mock_st.return_value = mock_model
        mock_torch.cuda.is_available.return_value = True

        config = EmbeddingConfig(device="cuda")
        embedder = BgeM3Embedder(config=config)
        assert embedder.device == "cuda"

        vectors = embedder.embed_texts(["Test text requiring fallback"])
        assert len(vectors) == 1
        assert len(vectors[0]) == 1024
        assert embedder.device == "cpu"
        mock_model.to.assert_called_with("cpu")
        mock_torch.cuda.empty_cache.assert_called_once()
