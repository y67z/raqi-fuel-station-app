"""Application entry point.

Two run modes are supported:

- ``polling`` (default): the bot polls Telegram for updates. We also start a
  tiny aiohttp server so platforms like Render's free Web Service that *require*
  an open HTTP port can still host the bot. UptimeRobot can ping ``/`` every
  five minutes to prevent the free dyno from idling.

- ``webhook``: the bot serves Telegram webhook updates over HTTPS. Useful when
  you have a stable public URL.

Both modes are designed to run forever and recover from transient errors.
"""
from __future__ import annotations

import asyncio
import logging
import signal
from typing import Any

from aiohttp import web
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from ai_service import AIService
from config import Settings, configure_logging, load_settings
from handlers import (
    RateLimiter,
    error_handler,
    help_command,
    make_forward_handler,
    make_photo_handler,
    start_command,
)

logger = logging.getLogger("bot")


def build_application(settings: Settings) -> Application:
    app = Application.builder().token(settings.bot_token).build()

    ai = AIService(gemini_api_key=settings.gemini_api_key, hf_api_token=settings.hf_api_token)
    limiter = RateLimiter(settings.rate_limit_per_minute)

    # Stash settings for handlers that need them.
    app.bot_data["settings"] = settings
    app.bot_data["ai"] = ai
    app.bot_data["limiter"] = limiter

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))

    # Photos with or without captions.
    app.add_handler(MessageHandler(filters.PHOTO, make_photo_handler(settings, ai, limiter)))

    # Everything else (text, documents, videos, audio, voice, stickers...).
    forward = make_forward_handler(settings)
    app.add_handler(
        MessageHandler(
            (filters.TEXT & ~filters.COMMAND)
            | filters.Document.ALL
            | filters.VIDEO
            | filters.AUDIO
            | filters.VOICE
            | filters.Sticker.ALL,
            forward,
        )
    )

    app.add_error_handler(error_handler)
    return app


# ---------------------------------------------------------------------------
# Tiny HTTP server (health check) so the bot survives on Render free tier.
# ---------------------------------------------------------------------------
async def _start_health_server(port: int) -> web.AppRunner:
    async def health(_req: web.Request) -> web.Response:
        return web.Response(text="ok")

    http_app = web.Application()
    http_app.router.add_get("/", health)
    http_app.router.add_get("/health", health)

    runner = web.AppRunner(http_app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=port)
    await site.start()
    logger.info("Health server listening on :%d", port)
    return runner


# ---------------------------------------------------------------------------
# Run modes
# ---------------------------------------------------------------------------
async def run_polling(settings: Settings) -> None:
    """Long-poll Telegram while serving an HTTP health endpoint in parallel."""
    health_runner = await _start_health_server(settings.port)
    application = build_application(settings)

    # Manually drive the application lifecycle so we can keep the health
    # server alive in the same event loop.
    await application.initialize()
    await application.start()
    await application.updater.start_polling(  # type: ignore[union-attr]
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )
    logger.info("Bot is up. Polling Telegram for updates…")

    stop_event = asyncio.Event()

    def _signal_handler(*_: Any) -> None:
        logger.info("Shutdown signal received")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            # Windows / restricted environments
            pass

    try:
        await stop_event.wait()
    finally:
        logger.info("Stopping bot…")
        await application.updater.stop()  # type: ignore[union-attr]
        await application.stop()
        await application.shutdown()
        await health_runner.cleanup()


async def run_webhook(settings: Settings) -> None:
    if not settings.webhook_url:
        raise RuntimeError("WEBHOOK_URL is required when MODE=webhook")
    application = build_application(settings)

    secret = settings.webhook_secret or ""
    url_path = f"/telegram/{settings.bot_token.split(':')[0]}"
    full_webhook_url = settings.webhook_url.rstrip("/") + url_path

    await application.bot.set_webhook(
        url=full_webhook_url,
        secret_token=secret or None,
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )
    logger.info("Webhook set to %s", full_webhook_url)

    await application.run_webhook(
        listen="0.0.0.0",
        port=settings.port,
        url_path=url_path.lstrip("/"),
        secret_token=secret or None,
        webhook_url=full_webhook_url,
    )


def main() -> None:
    settings = load_settings()
    configure_logging(settings.log_level)
    logger.info(
        "Starting Telegram AI bot | mode=%s | gemini=%s | port=%d",
        settings.mode,
        "yes" if settings.gemini_api_key else "no (fallback only)",
        settings.port,
    )

    if settings.mode == "webhook":
        asyncio.run(run_webhook(settings))
    else:
        asyncio.run(run_polling(settings))


if __name__ == "__main__":
    main()
