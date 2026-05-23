"""Application configuration loaded from environment variables.

All secrets must come from the environment. Nothing sensitive is committed.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass


def _get_env(name: str, default: str | None = None, required: bool = False) -> str | None:
    value = os.environ.get(name, default)
    if required and not value:
        raise RuntimeError(
            f"Environment variable {name!r} is required but was not set. "
            f"See .env.example."
        )
    return value


@dataclass(frozen=True)
class Settings:
    # Telegram
    bot_token: str
    owner_chat_id: int  # where every incoming message gets forwarded

    # AI providers
    gemini_api_key: str | None
    hf_api_token: str | None  # optional Hugging Face token (higher rate limits)

    # Runtime
    mode: str  # "polling" or "webhook"
    webhook_url: str | None
    webhook_secret: str | None
    port: int
    log_level: str

    # Limits
    max_image_mb: int
    rate_limit_per_minute: int


def load_settings() -> Settings:
    bot_token = _get_env("BOT_TOKEN", required=True)
    owner_raw = _get_env("OWNER_CHAT_ID", required=True)
    try:
        owner_chat_id = int(owner_raw)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise RuntimeError("OWNER_CHAT_ID must be an integer Telegram user/chat id") from exc

    return Settings(
        bot_token=bot_token,  # type: ignore[arg-type]
        owner_chat_id=owner_chat_id,
        gemini_api_key=_get_env("GEMINI_API_KEY"),
        hf_api_token=_get_env("HF_API_TOKEN"),
        mode=_get_env("MODE", "polling") or "polling",
        webhook_url=_get_env("WEBHOOK_URL"),
        webhook_secret=_get_env("WEBHOOK_SECRET"),
        port=int(_get_env("PORT", "8080") or "8080"),
        log_level=(_get_env("LOG_LEVEL", "INFO") or "INFO").upper(),
        max_image_mb=int(_get_env("MAX_IMAGE_MB", "20") or "20"),
        rate_limit_per_minute=int(_get_env("RATE_LIMIT_PER_MINUTE", "10") or "10"),
    )


def configure_logging(level: str) -> None:
    logging.basicConfig(
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        level=getattr(logging, level, logging.INFO),
    )
    # Quiet down noisy libraries
    for noisy in ("httpx", "httpcore", "telegram.ext._application", "telegram.request"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
