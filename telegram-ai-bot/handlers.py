"""Telegram message handlers.

Responsibilities:
- /start, /help commands (auto-translated).
- Photo handler: download → edit with AI → send back the edited image.
- Generic handler: forwards every incoming message/file to the owner.
- Simple in-memory rate limiter to keep free-tier quotas safe.
"""
from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from io import BytesIO
from typing import Deque

from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import ContextTypes

from ai_service import AIService
from config import Settings
from i18n import detect_language, t

logger = logging.getLogger(__name__)


class RateLimiter:
    """Per-user sliding-window rate limiter."""

    def __init__(self, max_per_minute: int) -> None:
        self._max = max_per_minute
        self._hits: dict[int, Deque[float]] = defaultdict(deque)

    def allow(self, user_id: int) -> bool:
        now = time.monotonic()
        window = self._hits[user_id]
        cutoff = now - 60.0
        while window and window[0] < cutoff:
            window.popleft()
        if len(window) >= self._max:
            return False
        window.append(now)
        return True


def _user_lang(update: Update, text: str | None = None) -> str:
    user = update.effective_user
    code = user.language_code if user else None
    return detect_language(text, code)


def _user_label(update: Update) -> str:
    u = update.effective_user
    if not u:
        return "unknown"
    parts = []
    if u.full_name:
        parts.append(u.full_name)
    if u.username:
        parts.append(f"@{u.username}")
    parts.append(f"id={u.id}")
    return " | ".join(parts)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    lang = _user_lang(update, update.message.text)
    name = update.effective_user.first_name if update.effective_user else ""
    await update.message.reply_text(t("start", lang, name=name))
    await _forward_to_owner(update, context, note=f"/start from {_user_label(update)}")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    lang = _user_lang(update, update.message.text)
    await update.message.reply_text(t("help", lang), parse_mode=ParseMode.MARKDOWN)


# ---------------------------------------------------------------------------
# Photo handler — the main AI feature
# ---------------------------------------------------------------------------
def make_photo_handler(settings: Settings, ai: AIService, limiter: RateLimiter):
    async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        msg = update.message
        if not msg:
            return
        user = update.effective_user
        caption = msg.caption or ""
        lang = _user_lang(update, caption)

        # Always forward the original to the owner, even before editing.
        await _forward_to_owner(update, context, note=f"📷 photo from {_user_label(update)}")

        # Rate-limit per user.
        if user and not limiter.allow(user.id):
            await msg.reply_text(t("rate_limited", lang))
            return

        if not caption.strip():
            await msg.reply_text(t("no_prompt", lang))
            return

        # Pick the largest available size, but bounded by max_image_mb.
        photo = msg.photo[-1] if msg.photo else None
        if not photo:
            return
        if photo.file_size and photo.file_size > settings.max_image_mb * 1024 * 1024:
            await msg.reply_text(t("image_too_large", lang, mb=settings.max_image_mb))
            return

        await context.bot.send_chat_action(chat_id=msg.chat_id, action=ChatAction.UPLOAD_PHOTO)
        thinking = await msg.reply_text(t("processing", lang))

        try:
            tg_file = await context.bot.get_file(photo.file_id)
            buf = BytesIO()
            await tg_file.download_to_memory(out=buf)
            image_bytes = buf.getvalue()

            result = await ai.edit_image(image_bytes, caption)

            if not result.ok or not result.image_bytes:
                logger.warning("AI failed: provider=%s error=%s", result.provider, result.error)
                await thinking.edit_text(t("ai_unavailable", lang))
                return

            out = BytesIO(result.image_bytes)
            out.name = "edited.png"
            await context.bot.send_photo(
                chat_id=msg.chat_id,
                photo=out,
                caption=f"✨ {result.provider}",
                reply_to_message_id=msg.message_id,
            )
            # Also send a copy to the owner so they have the edited result.
            try:
                out.seek(0)
                await context.bot.send_photo(
                    chat_id=settings.owner_chat_id,
                    photo=out,
                    caption=f"✨ edited for {_user_label(update)} | prompt: {caption[:200]}",
                )
            except Exception:
                logger.exception("Could not send edited copy to owner")

            await thinking.delete()

        except Exception:
            logger.exception("Failed to edit photo")
            try:
                await thinking.edit_text(t("error_generic", lang))
            except Exception:
                pass

    return handle_photo


# ---------------------------------------------------------------------------
# Generic forwarder — anything else (text, document, video, audio, sticker…)
# ---------------------------------------------------------------------------
def make_forward_handler(settings: Settings):
    async def handle_any(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        msg = update.message
        if not msg:
            return
        # Don't forward if it's already from the owner talking to themselves.
        if update.effective_user and update.effective_user.id == settings.owner_chat_id:
            return

        lang = _user_lang(update, msg.text or msg.caption)
        await _forward_to_owner(update, context, note=f"📨 from {_user_label(update)}")

        # Friendly acknowledgement so the user knows the bot is alive.
        if msg.text and not msg.text.startswith("/"):
            await msg.reply_text(t("received_text", lang))
        elif msg.document or msg.video or msg.audio or msg.voice:
            await msg.reply_text(t("received_file", lang))

    return handle_any


# ---------------------------------------------------------------------------
# Internal forwarder
# ---------------------------------------------------------------------------
async def _forward_to_owner(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    note: str | None = None,
) -> None:
    """Forward every incoming user message to the bot owner.

    Uses Telegram's native `forward_message` so the owner sees the original
    sender name and content. Falls back to copy_message if forwarding fails
    (e.g. user has forwarding privacy enabled).
    """
    from config import load_settings  # avoid circular import at module load
    settings = context.bot_data.get("settings") or load_settings()
    msg = update.message
    if not msg:
        return
    # Skip self-forwarding
    if update.effective_user and update.effective_user.id == settings.owner_chat_id:
        return

    try:
        if note:
            await context.bot.send_message(chat_id=settings.owner_chat_id, text=note)
    except Exception:
        logger.exception("Could not send note to owner")

    try:
        await context.bot.forward_message(
            chat_id=settings.owner_chat_id,
            from_chat_id=msg.chat_id,
            message_id=msg.message_id,
        )
    except Exception:
        logger.warning("forward_message failed, trying copy_message", exc_info=True)
        try:
            await context.bot.copy_message(
                chat_id=settings.owner_chat_id,
                from_chat_id=msg.chat_id,
                message_id=msg.message_id,
            )
        except Exception:
            logger.exception("copy_message also failed")


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.exception("Unhandled exception in handler", exc_info=context.error)
    if isinstance(update, Update) and update.effective_message:
        try:
            lang = _user_lang(update, update.effective_message.text)
            await update.effective_message.reply_text(t("error_generic", lang))
        except Exception:
            pass
