"""AI image-editing service.

Primary provider: Google Gemini 2.5 Flash Image (a.k.a. "Nano Banana").
- Free tier on Google AI Studio is generous and supports image editing
  conditioned on a text prompt + reference image.

Fallback provider: Pollinations.ai
- Completely free, no API key. Used only as a graceful degradation when Gemini
  is unavailable (no key configured, quota exceeded, transient errors).
- Note: Pollinations primarily generates images from prompts; we feed it a
  prompt that mentions the user's intent so the user still gets *something*.
"""
from __future__ import annotations

import asyncio
import io
import logging
from dataclasses import dataclass
from typing import Optional
from urllib.parse import quote

import httpx
from PIL import Image

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash-image-preview"
GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)
POLLINATIONS_ENDPOINT = "https://image.pollinations.ai/prompt/{prompt}"


@dataclass
class EditResult:
    image_bytes: Optional[bytes]
    provider: str
    error: Optional[str] = None

    @property
    def ok(self) -> bool:
        return self.image_bytes is not None


class AIService:
    """Encapsulates calls to the AI providers used to edit images."""

    def __init__(self, gemini_api_key: str | None, hf_api_token: str | None = None) -> None:
        self._gemini_key = gemini_api_key
        self._hf_token = hf_api_token  # reserved for a future HF fallback

    async def edit_image(self, image_bytes: bytes, prompt: str) -> EditResult:
        """Edit an image based on a text prompt.

        Tries Gemini first, falls back to Pollinations on failure.
        """
        # Normalize to PNG so providers are happy with any input format
        try:
            normalized = _normalize_to_png(image_bytes)
        except Exception as exc:
            logger.exception("Could not decode user image")
            return EditResult(None, "none", error=f"decode error: {exc}")

        if self._gemini_key:
            result = await self._edit_with_gemini(normalized, prompt)
            if result.ok:
                return result
            logger.warning("Gemini failed, falling back to Pollinations: %s", result.error)
        else:
            logger.info("GEMINI_API_KEY not set, using Pollinations fallback only.")

        return await self._generate_with_pollinations(prompt)

    # ------------------------------------------------------------------
    # Gemini
    # ------------------------------------------------------------------
    async def _edit_with_gemini(self, png_bytes: bytes, prompt: str) -> EditResult:
        import base64

        url = GEMINI_ENDPOINT.format(model=GEMINI_MODEL)
        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": base64.b64encode(png_bytes).decode("ascii"),
                            }
                        },
                    ],
                }
            ],
            # Ask the model to return an image (and optionally text).
            "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self._gemini_key or "",
        }

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(url, json=body, headers=headers)
        except httpx.HTTPError as exc:
            return EditResult(None, "gemini", error=f"network error: {exc}")

        if resp.status_code != 200:
            return EditResult(
                None,
                "gemini",
                error=f"http {resp.status_code}: {resp.text[:300]}",
            )

        data = resp.json()
        # Walk the response to find the first inline image part.
        for cand in data.get("candidates", []):
            for part in cand.get("content", {}).get("parts", []):
                inline = part.get("inline_data") or part.get("inlineData")
                if inline and inline.get("data"):
                    try:
                        img = base64.b64decode(inline["data"])
                    except Exception as exc:
                        return EditResult(None, "gemini", error=f"bad base64: {exc}")
                    return EditResult(img, "gemini")

        return EditResult(None, "gemini", error="no image in response")

    # ------------------------------------------------------------------
    # Pollinations (free fallback, prompt-only generation)
    # ------------------------------------------------------------------
    async def _generate_with_pollinations(self, prompt: str) -> EditResult:
        url = POLLINATIONS_ENDPOINT.format(prompt=quote(prompt)[:1500])
        params = {"width": 1024, "height": 1024, "nologo": "true", "safe": "true"}
        try:
            async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
                resp = await client.get(url, params=params)
        except httpx.HTTPError as exc:
            return EditResult(None, "pollinations", error=f"network error: {exc}")

        if resp.status_code != 200 or not resp.content:
            return EditResult(
                None,
                "pollinations",
                error=f"http {resp.status_code}",
            )
        return EditResult(resp.content, "pollinations")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _normalize_to_png(image_bytes: bytes, max_side: int = 1536) -> bytes:
    """Decode any common image format and re-encode as PNG, resized if huge."""
    with Image.open(io.BytesIO(image_bytes)) as img:
        img = img.convert("RGBA") if img.mode in ("P", "LA") else img.convert("RGB")
        w, h = img.size
        if max(w, h) > max_side:
            scale = max_side / max(w, h)
            img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        return buf.getvalue()


# Async-friendly wrapper for blocking PIL work.
async def normalize_to_png_async(image_bytes: bytes) -> bytes:
    return await asyncio.to_thread(_normalize_to_png, image_bytes)
