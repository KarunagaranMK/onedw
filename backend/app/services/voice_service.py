"""
Voice transcription service — converts voice recordings to text.
Uses Gemini's multimodal capabilities with a local regex fallback.
"""
import json
import re
import logging
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger("onedw.voice")

_TRANSCRIPTION_PROMPT = """
You are a speech transcription service for a home services platform.
Listen to this audio recording and transcribe the spoken words accurately.
The customer is describing a home repair or service issue.

Return ONLY valid JSON:
{{
    "transcript": "The full transcribed text",
    "language": "Detected language (e.g. English, Hindi, Tamil)",
    "confidence": 0.95
}}

If you cannot understand the audio, return:
{{
    "transcript": "",
    "language": "unknown",
    "confidence": 0.0
}}
"""


def _get_model():
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                return genai.GenerativeModel(model_name)
            except Exception:
                continue
        return None
    except Exception as exc:
        logger.error("Failed to init Gemini for voice transcription: %s", exc)
        return None


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    return json.loads(cleaned)


async def transcribe_voice(audio_url: str) -> dict:
    """Transcribe a voice recording. Falls back to a placeholder when Gemini is unavailable."""
    model = _get_model()
    if model is None:
        logger.info("Gemini unavailable — voice transcription not possible without API key.")
        return {
            "transcript": "",
            "language": "unknown",
            "confidence": 0.0,
            "note": "Voice transcription requires Gemini API key. Audio is saved for manual review.",
        }

    try:
        import urllib.request
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(audio_url, headers={"User-Agent": "OneDW/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            audio_data = response.read()

        mime_type = "audio/mp3"
        if audio_url.endswith(".wav"):
            mime_type = "audio/wav"
        elif audio_url.endswith(".m4a"):
            mime_type = "audio/m4a"

        prompt = _TRANSCRIPTION_PROMPT
        response = model.generate_content([prompt, {"mime_type": mime_type, "data": audio_data}])
        parsed = _extract_json(response.text)
        return {
            "transcript": parsed.get("transcript", ""),
            "language": parsed.get("language", "unknown"),
            "confidence": float(parsed.get("confidence", 0.8)),
        }
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "quota" in err_str.lower():
            logger.warning("Gemini quota exceeded for voice transcription.")
        else:
            logger.error("Voice transcription failed: %s", exc)
        return {
            "transcript": "",
            "language": "unknown",
            "confidence": 0.0,
            "note": "Transcription failed. Audio is saved for manual review.",
        }
