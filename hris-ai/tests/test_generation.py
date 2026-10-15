"""Unit and contract tests for the grounded generation subsystem."""

import os
from unittest.mock import MagicMock, patch
import pytest

from src.indexing.interface import DocumentChunk
from src.retrieval.interface import RetrievalResult
from src.generation.interface import Citation, GenerationResult, BaseGenerator
from src.generation.config import GenerationConfig
from src.generation.exceptions import (
    GenerationError,
    GenerationConfigError,
    GenerationAPIError,
    sanitize_message,
)
from src.generation.prompt import build_grounded_messages
from src.generation.citation import parse_citations, SENTINEL_INSUFFICIENT_CONTEXT
from src.generation.factory import get_generator
from src.generation.adapters.openai_generator import OpenAIGenerator
from src.generation.adapters.anthropic_generator import AnthropicGenerator


@pytest.fixture
def sample_chunk_1() -> DocumentChunk:
    return DocumentChunk(
        chunk_id="hr-policy#c0001",
        document_id="hr-policy",
        text="Karyawan berhak mendapatkan cuti tahunan sebanyak 12 hari kerja setelah bekerja selama 12 bulan berturut-turut.",
        chunk_index=0,
        char_start=0,
        char_end=112,
        page_number=1,
        created_at="2026-10-05T00:00:00Z",
        created_by="system",
    )


@pytest.fixture
def sample_chunk_2() -> DocumentChunk:
    return DocumentChunk(
        chunk_id="hr-policy#c0002",
        document_id="hr-policy",
        text="Permohonan cuti tahunan harus diajukan paling lambat 7 hari kerja sebelum tanggal pelaksanaan cuti.",
        chunk_index=1,
        char_start=113,
        char_end=211,
        page_number=1,
        created_at="2026-10-05T00:00:00Z",
        created_by="system",
    )


@pytest.fixture
def sample_context(sample_chunk_1: DocumentChunk, sample_chunk_2: DocumentChunk) -> list[RetrievalResult]:
    return [
        RetrievalResult(chunk=sample_chunk_1, score=0.92, rank=1),
        RetrievalResult(chunk=sample_chunk_2, score=0.85, rank=2),
    ]


# ==============================================================================
# 1. Configuration & Credential Resolution Tests
# ==============================================================================

def test_generation_config_validation():
    """Verify GenerationConfig validates input constraints."""
    config = GenerationConfig(provider="openai", model_name="gpt-4o-mini")
    assert config.provider == "openai"
    assert config.temperature == 0.0

    with pytest.raises(GenerationConfigError, match="Unsupported provider"):
        GenerationConfig(provider="unsupported_provider")

    with pytest.raises(GenerationConfigError, match="Temperature must be between"):
        GenerationConfig(provider="openai", temperature=2.5)

    with pytest.raises(GenerationConfigError, match="max_tokens must be >= 1"):
        GenerationConfig(provider="openai", max_tokens=0)


def test_generation_config_from_env(monkeypatch):
    """Verify from_env resolves unified and provider-specific variables."""
    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.setenv("LLM_BASE_URL", "https://api.sumopod.com/v1")
    monkeypatch.setenv("LLM_API_KEY", "sumo-secret-key-1234567890")
    monkeypatch.setenv("LLM_MODEL", "claude-3-5-sonnet")

    config = GenerationConfig.from_env()
    assert config.provider == "anthropic"
    assert config.base_url == "https://api.sumopod.com/v1"
    assert config.api_key == "sumo-secret-key-1234567890"
    assert config.model_name == "claude-3-5-sonnet"


def test_generation_config_fallback_env(monkeypatch):
    """Verify from_env falls back to standard provider environment variables."""
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.setenv("OPENAI_API_KEY", "sk-proj-test1234567890abcdef")

    config = GenerationConfig.from_env()
    assert config.provider == "openai"
    assert config.api_key == "sk-proj-test1234567890abcdef"
    assert config.model_name == "gpt-4o-mini"


# ==============================================================================
# 2. Secret Sanitization Tests
# ==============================================================================

def test_sanitize_message():
    """Verify secrets and API keys are redacted from error logs."""
    raw = "Request failed with sk-proj-1234567890abcdef123456 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    sanitized = sanitize_message(raw)
    assert "sk-proj-" not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized
    assert "[REDACTED_TOKEN]" in sanitized


# ==============================================================================
# 3. Prompt Building & Citation Parsing Tests
# ==============================================================================

def test_build_grounded_messages(sample_context):
    """Verify grounded prompt formats system instructions and context blocks."""
    query = "Berapa hari jatah cuti tahunan?"
    system_prompt, user_prompt = build_grounded_messages(query, sample_context)

    assert "truth-grounded enterprise assistant" in system_prompt
    assert "[INSUFFICIENT_CONTEXT]" in system_prompt
    assert "[1]" in user_prompt
    assert "hr-policy#c0001" in user_prompt
    assert query in user_prompt


def test_parse_citations_normal(sample_context):
    """Verify bracketed citations are extracted and mapped to Citation domain objects."""
    raw_text = "Karyawan berhak atas 12 hari cuti [1], diajukan 7 hari sebelumnya [2]."
    clean_text, citations, has_context = parse_citations(raw_text, sample_context)

    assert has_context is True
    assert clean_text == raw_text
    assert len(citations) == 2
    assert citations[0].chunk_id == "hr-policy#c0001"
    assert citations[0].document_id == "hr-policy"
    assert citations[0].relevance_score == 0.92
    assert "12 hari kerja" in citations[0].reference_snippet
    assert citations[1].chunk_id == "hr-policy#c0002"


def test_parse_citations_out_of_bounds(sample_context):
    """Verify non-existent citation indices are ignored safely without crashing."""
    raw_text = "Karyawan berhak atas cuti [1], dan info lainnya [9]."
    clean_text, citations, has_context = parse_citations(raw_text, sample_context)

    assert has_context is True
    assert len(citations) == 1
    assert citations[0].chunk_id == "hr-policy#c0001"


def test_parse_citations_sentinel_abstention(sample_context):
    """Verify [INSUFFICIENT_CONTEXT] sentinel triggers explicit abstention."""
    raw_text = f"{SENTINEL_INSUFFICIENT_CONTEXT} Informasi tidak ditemukan."
    clean_text, citations, has_context = parse_citations(
        raw_text, sample_context, query_lang="id"
    )

    assert has_context is False
    assert len(citations) == 0
    assert SENTINEL_INSUFFICIENT_CONTEXT not in clean_text
    assert "Maaf" in clean_text or "tidak ditemukan" in clean_text


# ==============================================================================
# 4. OpenAI Adapter Tests
# ==============================================================================

def test_openai_generator_success(sample_context):
    """Verify OpenAIGenerator executes chat completion and maps citations."""
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Karyawan mendapat 12 hari cuti per tahun [1]."
    mock_client.chat.completions.create.return_value = MagicMock(choices=[mock_choice])

    config = GenerationConfig(
        provider="openai",
        api_key="mock-key",
        base_url="https://api.sumopod.com/v1",
        model_name="gpt-4o-mini",
    )
    generator = OpenAIGenerator(config=config, client=mock_client)

    result = generator.generate("Berapa hari cuti?", sample_context)
    assert isinstance(result, GenerationResult)
    assert result.has_sufficient_context is True
    assert "12 hari cuti" in result.answer
    assert len(result.citations) == 1
    assert result.citations[0].chunk_id == "hr-policy#c0001"

    # Verify mock call parameters
    mock_client.chat.completions.create.assert_called_once()
    call_kwargs = mock_client.chat.completions.create.call_args[1]
    assert call_kwargs["model"] == "gpt-4o-mini"
    assert call_kwargs["temperature"] == 0.0


def test_openai_generator_empty_context_bypass():
    """Verify OpenAIGenerator immediately abstains on empty context without API call."""
    mock_client = MagicMock()
    config = GenerationConfig(provider="openai", api_key="mock-key")
    generator = OpenAIGenerator(config=config, client=mock_client)

    result = generator.generate("Pertanyaan sembarang", context=[])
    assert result.has_sufficient_context is False
    assert len(result.citations) == 0
    assert mock_client.chat.completions.create.call_count == 0


def test_openai_generator_transient_retry(sample_context):
    """Verify OpenAIGenerator retries transient errors with backoff."""
    import openai

    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Sukses setelah retry [1]."

    # Fail once with RateLimitError, then succeed
    mock_client.chat.completions.create.side_effect = [
        openai.RateLimitError(
            message="Rate limit exceeded",
            response=MagicMock(status_code=429),
            body=None,
        ),
        MagicMock(choices=[mock_choice]),
    ]

    config = GenerationConfig(provider="openai", api_key="mock-key", max_retries=2)
    generator = OpenAIGenerator(config=config, client=mock_client)

    result = generator.generate("Berapa hari cuti?", sample_context)
    assert result.has_sufficient_context is True
    assert "Sukses setelah retry" in result.answer
    assert mock_client.chat.completions.create.call_count == 2


def test_openai_generator_exhausted_retries(sample_context):
    """Verify OpenAIGenerator raises GenerationAPIError when retries are exhausted."""
    import openai

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = openai.APIConnectionError(
        message="Connection failed to sk-test-1234567890abcdef123",
        request=MagicMock(),
    )

    config = GenerationConfig(provider="openai", api_key="mock-key", max_retries=1)
    generator = OpenAIGenerator(config=config, client=mock_client)

    with pytest.raises(GenerationAPIError) as exc_info:
        generator.generate("Berapa hari cuti?", sample_context)

    assert "sk-test-" not in str(exc_info.value)
    assert mock_client.chat.completions.create.call_count == 2


# ==============================================================================
# 5. Anthropic Adapter Tests
# ==============================================================================

def test_anthropic_generator_success(sample_context):
    """Verify AnthropicGenerator executes messages request and maps citations."""
    mock_client = MagicMock()
    mock_block = MagicMock()
    mock_block.text = "Berdasarkan dokumen, pengajuan cuti dilakukan 7 hari kerja sebelumnya [2]."
    mock_client.messages.create.return_value = MagicMock(content=[mock_block])

    config = GenerationConfig(
        provider="anthropic",
        api_key="mock-key",
        base_url="https://api.sumopod.com/v1",
        model_name="claude-3-5-sonnet",
    )
    generator = AnthropicGenerator(config=config, client=mock_client)

    result = generator.generate("Kapan cuti diajukan?", sample_context)
    assert isinstance(result, GenerationResult)
    assert result.has_sufficient_context is True
    assert "7 hari kerja" in result.answer
    assert len(result.citations) == 1
    assert result.citations[0].chunk_id == "hr-policy#c0002"

    # Verify mock call parameters
    mock_client.messages.create.assert_called_once()
    call_kwargs = mock_client.messages.create.call_args[1]
    assert call_kwargs["model"] == "claude-3-5-sonnet"
    assert "system" in call_kwargs


def test_anthropic_generator_empty_context_bypass():
    """Verify AnthropicGenerator immediately abstains on empty context without API call."""
    mock_client = MagicMock()
    config = GenerationConfig(provider="anthropic", api_key="mock-key")
    generator = AnthropicGenerator(config=config, client=mock_client)

    result = generator.generate("Pertanyaan sembarang", context=[])
    assert result.has_sufficient_context is False
    assert len(result.citations) == 0
    assert mock_client.messages.create.call_count == 0


# ==============================================================================
# 6. Factory Loader & Provider Switching Tests
# ==============================================================================

def test_get_generator_factory(monkeypatch):
    """Verify get_generator dynamically instantiates OpenAIGenerator or AnthropicGenerator."""
    # 1. Test OpenAI instantiation
    openai_cfg = GenerationConfig(provider="openai", api_key="test-key")
    gen_openai = get_generator(openai_cfg)
    assert isinstance(gen_openai, OpenAIGenerator)

    # 2. Test Anthropic instantiation
    anthropic_cfg = GenerationConfig(provider="anthropic", api_key="test-key")
    gen_anthropic = get_generator(anthropic_cfg)
    assert isinstance(gen_anthropic, AnthropicGenerator)

    # 3. Test environment-driven instantiation
    monkeypatch.setenv("LLM_PROVIDER", "anthropic")
    monkeypatch.setenv("LLM_API_KEY", "test-env-key")
    gen_env = get_generator()
    assert isinstance(gen_env, AnthropicGenerator)


def test_generation_config_sumopod_normalization():
    """Verify SumoPod base_url automatically appends /v1 if omitted."""
    cfg = GenerationConfig(provider="openai", base_url="https://ai.sumopod.com")
    assert cfg.base_url == "https://ai.sumopod.com/v1"

    cfg2 = GenerationConfig(provider="openai", base_url="https://ai.sumopod.com/v1")
    assert cfg2.base_url == "https://ai.sumopod.com/v1"

