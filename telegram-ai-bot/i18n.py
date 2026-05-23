"""Bilingual (Arabic / English) message catalog with automatic language detection.

Detection is intentionally lightweight (no extra dependencies). It looks at the
ratio of Arabic Unicode characters in the user-provided text and falls back to
the user's Telegram language_code when text is empty (e.g. a photo with no
caption).
"""
from __future__ import annotations

from typing import Literal

Lang = Literal["ar", "en"]

# Arabic block: U+0600..U+06FF, plus Arabic supplement / extended ranges
_ARABIC_RANGES = (
    (0x0600, 0x06FF),
    (0x0750, 0x077F),
    (0x08A0, 0x08FF),
    (0xFB50, 0xFDFF),
    (0xFE70, 0xFEFF),
)


def _is_arabic_char(ch: str) -> bool:
    code = ord(ch)
    return any(start <= code <= end for start, end in _ARABIC_RANGES)


def detect_language(text: str | None, telegram_lang_code: str | None = None) -> Lang:
    """Return 'ar' or 'en' based on the message text, falling back to Telegram hint."""
    if text:
        letters = [c for c in text if c.isalpha()]
        if letters:
            arabic = sum(1 for c in letters if _is_arabic_char(c))
            if arabic / len(letters) >= 0.30:
                return "ar"
            return "en"
    if telegram_lang_code:
        if telegram_lang_code.lower().startswith("ar"):
            return "ar"
    return "en"


# ---------------------------------------------------------------------------
# Message catalog
# ---------------------------------------------------------------------------
MESSAGES: dict[str, dict[Lang, str]] = {
    "start": {
        "ar": (
            "مرحباً {name} 👋\n\n"
            "أنا بوت ذكي يقدر:\n"
            "🎨 يعدّل لك الصور بالذكاء الاصطناعي — أرسل لي صورة مع وصف للتعديل المطلوب.\n"
            "💬 يرد على رسائلك ويستقبل ملفاتك.\n\n"
            "جرب الآن: أرسل لي صورة واكتب في caption مثلاً «حوّلها أبيض وأسود» أو «أضف خلفية بحر»."
        ),
        "en": (
            "Hello {name} 👋\n\n"
            "I'm an AI bot that can:\n"
            "🎨 Edit images with AI — send me a photo with a caption describing the edit.\n"
            "💬 Receive your messages and files.\n\n"
            "Try it: send a photo and add a caption like \"make it black and white\" "
            "or \"add a beach background\"."
        ),
    },
    "help": {
        "ar": (
            "📖 *كيف تستخدم البوت؟*\n\n"
            "1️⃣ أرسل صورة مع caption يصف التعديل.\n"
            "2️⃣ انتظر بضع ثوانٍ، رح أرجع لك النسخة المعدّلة.\n"
            "3️⃣ تقدر ترسل لي ملفات ورسائل عادية أيضاً.\n\n"
            "*أمثلة على البرومبت:*\n"
            "• اجعلها بأسلوب أنمي\n"
            "• أضف نظارة شمسية\n"
            "• غيّر الخلفية إلى ليل ومدينة\n"
            "• حسّن الجودة ووضّح الألوان"
        ),
        "en": (
            "📖 *How to use the bot*\n\n"
            "1️⃣ Send a photo with a caption describing the edit.\n"
            "2️⃣ Wait a few seconds, I'll send back the edited version.\n"
            "3️⃣ You can also send regular messages and files.\n\n"
            "*Prompt examples:*\n"
            "• make it anime style\n"
            "• add sunglasses\n"
            "• change background to a city at night\n"
            "• enhance quality and colors"
        ),
    },
    "no_prompt": {
        "ar": "📝 الرجاء إرسال وصف للتعديل في caption الصورة. مثال: «حوّلها رسم كرتوني».",
        "en": "📝 Please add a caption describing the edit. Example: \"turn it into a cartoon\".",
    },
    "processing": {
        "ar": "⏳ جاري تعديل الصورة… قد تستغرق العملية حتى دقيقة.",
        "en": "⏳ Editing your image… this may take up to a minute.",
    },
    "ai_unavailable": {
        "ar": (
            "⚠️ خدمة تعديل الصور غير متاحة حالياً. حاول مرة أخرى بعد قليل.\n"
            "(تجاوز الحد اليومي المجاني أو خطأ مؤقت)"
        ),
        "en": (
            "⚠️ The image-editing service is unavailable right now. Please try again later.\n"
            "(daily free quota exceeded or temporary error)"
        ),
    },
    "ai_no_image": {
        "ar": "🤔 لم يتمكن الذكاء الاصطناعي من إنتاج صورة. جرب برومبت أوضح أو صورة أخرى.",
        "en": "🤔 The AI didn't return an image. Try a clearer prompt or a different photo.",
    },
    "image_too_large": {
        "ar": "📦 الصورة كبيرة جداً. الحد الأقصى {mb}MB.",
        "en": "📦 The image is too large. Max size: {mb}MB.",
    },
    "rate_limited": {
        "ar": "🛑 ترسل بسرعة! انتظر قليلاً ثم حاول مرة أخرى.",
        "en": "🛑 Slow down! Please wait a moment and try again.",
    },
    "received_text": {
        "ar": "✅ استلمت رسالتك. لتعديل صورة بالذكاء الاصطناعي، أرسل صورة مع caption.",
        "en": "✅ I received your message. To edit an image with AI, send a photo with a caption.",
    },
    "received_file": {
        "ar": "✅ استلمت الملف بنجاح وتم حفظه.",
        "en": "✅ File received and forwarded successfully.",
    },
    "error_generic": {
        "ar": "❌ حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.",
        "en": "❌ Something went wrong. Please try again.",
    },
}


def t(key: str, lang: Lang, **kwargs: object) -> str:
    """Translate a key into the requested language with optional formatting."""
    entry = MESSAGES.get(key)
    if not entry:
        return key
    template = entry.get(lang) or entry.get("en") or key
    if kwargs:
        try:
            return template.format(**kwargs)
        except (KeyError, IndexError):
            return template
    return template
