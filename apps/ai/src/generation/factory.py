"""Factory for dynamic, plug-and-play LLM generator instantiation."""

from typing import Optional

from src.generation.adapters.anthropic_generator import AnthropicGenerator
from src.generation.adapters.openai_generator import OpenAIGenerator
from src.generation.config import GenerationConfig
from src.generation.exceptions import GenerationConfigError
from src.generation.interface import BaseGenerator


def get_generator(config: Optional[GenerationConfig] = None) -> BaseGenerator:
    """Instantiate a plug-and-play generator adapter based on configuration or environment.

    Args:
        config: Optional GenerationConfig instance. If None, resolved via GenerationConfig.from_env().

    Returns:
        An instance of BaseGenerator (OpenAIGenerator or AnthropicGenerator).

    Raises:
        GenerationConfigError: If the provider is unsupported or credentials are invalid.
    """
    resolved_config = config if config is not None else GenerationConfig.from_env()

    provider = resolved_config.provider.lower().strip()
    if provider == "openai":
        return OpenAIGenerator(config=resolved_config)
    elif provider == "anthropic":
        return AnthropicGenerator(config=resolved_config)
    else:
        raise GenerationConfigError(
            f"Unsupported provider '{provider}'. Must be 'openai' or 'anthropic'."
        )
