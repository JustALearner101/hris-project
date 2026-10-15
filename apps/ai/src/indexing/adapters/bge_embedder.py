"""Concrete adapter for BAAI/bge-m3 multilingual embeddings using sentence-transformers."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Sequence

import torch
from sentence_transformers import SentenceTransformer

from src.indexing.exceptions import ContextLengthExceededError, ModelLoadError
from src.indexing.interface import BaseEmbedder, EmbeddingConfig

logger = logging.getLogger(__name__)


class BgeM3Embedder(BaseEmbedder):
    """Adapter for BAAI/bge-m3 dense multilingual embedding generation."""

    def __init__(self, config: EmbeddingConfig | None = None) -> None:
        self.config = config or EmbeddingConfig()

        # Resolve model cache folder, prioritizing MODEL_CACHE_DIR environment variable
        env_cache = os.environ.get("MODEL_CACHE_DIR")
        self.cache_folder = Path(env_cache) if env_cache else self.config.cache_folder
        self.cache_folder.mkdir(parents=True, exist_ok=True)

        # Resolve compute device
        if self.config.device:
            self.device = self.config.device
        else:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"

        logger.info(
            "Initializing %s on device=%s (cache_folder=%s)",
            self.config.model_name,
            self.device,
            self.cache_folder,
        )

        try:
            self.model = SentenceTransformer(
                model_name_or_path=self.config.model_name,
                cache_folder=str(self.cache_folder),
                device=self.device,
            )
        except Exception as exc:
            raise ModelLoadError(
                f"Failed to load embedding model '{self.config.model_name}' on device '{self.device}': {exc}"
            ) from exc

        self.tokenizer = getattr(self.model, "tokenizer", None)
        self.max_length = self.config.max_length

    def _count_tokens(self, text: str) -> int:
        """Count tokens in text using the model tokenizer, or whitespace fallback."""
        if self.tokenizer and hasattr(self.tokenizer, "encode"):
            tokens = self.tokenizer.encode(text, add_special_tokens=False)
            return len(tokens)
        return len(text.split())

    def embed_texts(self, texts: Sequence[str]) -> Sequence[Sequence[float]]:
        """Compute normalized 1024-dimensional embedding vectors for text chunks.

        Raises:
            ContextLengthExceededError: If any chunk exceeds max_length tokens.
        """
        if not texts:
            return []

        # Validate sequence bounds per chunk (fail-fast to protect index fidelity)
        for idx, text in enumerate(texts):
            token_count = self._count_tokens(text)
            if token_count > self.max_length:
                raise ContextLengthExceededError(
                    f"Text chunk at index {idx} exceeds maximum context length of {self.max_length} tokens (got {token_count} tokens).",
                    token_count=token_count,
                    max_length=self.max_length,
                )

        try:
            raw_embeddings = self.model.encode(
                list(texts),
                batch_size=self.config.batch_size,
                normalize_embeddings=self.config.normalize_embeddings,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
        except Exception as exc:
            if "out of memory" in str(exc).lower() and self.device == "cuda":
                logger.warning("CUDA OOM encountered during encoding; falling back to CPU.")
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                self.device = "cpu"
                self.model.to("cpu")
                raw_embeddings = self.model.encode(
                    list(texts),
                    batch_size=self.config.batch_size,
                    normalize_embeddings=self.config.normalize_embeddings,
                    convert_to_numpy=True,
                    show_progress_bar=False,
                )
            else:
                raise

        output: list[list[float]] = []
        for vec in raw_embeddings:
            if hasattr(vec, "tolist"):
                output.append([float(x) for x in vec.tolist()])
            else:
                output.append([float(x) for x in vec])
        return output

    def embed_query(self, query: str) -> Sequence[float]:
        """Compute normalized embedding vector for a search query, truncating if oversized."""
        # Truncate query gracefully to max_length if it exceeds token bounds
        if self.tokenizer and hasattr(self.tokenizer, "encode") and hasattr(self.tokenizer, "decode"):
            tokens = self.tokenizer.encode(query, add_special_tokens=False)
            if len(tokens) > self.max_length:
                truncated_tokens = tokens[: self.max_length]
                query = self.tokenizer.decode(truncated_tokens)

        vectors = self.embed_texts([query])
        return vectors[0]
