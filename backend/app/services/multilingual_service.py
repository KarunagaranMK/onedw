"""
Multilingual AI service — Gemini-powered translation.
Supports: English (en), Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml).
"""
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger("onedw.multilingual")

SUPPORTED_LANGUAGES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "ml": "Malayalam",
}

# Simple built-in translations for common phrases (fallback when Gemini unavailable)
_GREETINGS = {
    "ta": "வணக்கம்! நான் OneDW AI உதவியாளர். உங்கள் வீட்டு சேவை சிக்கல்களை தீர்க்க உதவுவேன்.",
    "hi": "नमस्ते! मैं OneDW AI सहायक हूं। आपकी घरेलू सेवा समस्याओं में मदद करूंगा।",
    "te": "నమస్కారం! నేను OneDW AI సహాయకుడిని. మీ గృహ సేవా సమస్యలను పరిష్కరించడంలో సహాయం చేస్తాను.",
    "ml": "നമസ്‌കാരം! ഞാൻ OneDW AI അസിസ്റ്റന്റ് ആണ്. നിങ്ങളുടെ വീട്ടുപകരണ സർവ്വീസ് പ്രശ്നങ്ങൾ പരിഹരിക്കാൻ സഹായിക്കും.",
    "en": "Hello! I'm your OneDW AI assistant. I'll help you with all your home service needs.",
}

_TRANSLATE_PROMPT = """Translate the following text from {source_lang_name} to {target_lang_name}.
Return ONLY the translated text, nothing else. Do not add explanations or notes.

Text to translate:
{text}"""

_TO_ENGLISH_PROMPT = """Translate the following text to English.
Return ONLY the English translation, nothing else.

Text to translate:
{text}"""


def _get_model():
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]:
            try:
                return genai.GenerativeModel(model_name)
            except Exception:
                continue
        return None
    except Exception as exc:
        logger.error("Failed to init Gemini for translation: %s", exc)
        return None


async def translate_text(text: str, target_language: str, source_language: str = "en") -> str:
    """
    Translate text between supported languages using Gemini.
    Falls back to original text if translation fails.
    """
    if target_language == source_language:
        return text

    if target_language not in SUPPORTED_LANGUAGES:
        logger.warning(f"Unsupported target language: {target_language}")
        return text

    source_name = SUPPORTED_LANGUAGES.get(source_language, "English")
    target_name = SUPPORTED_LANGUAGES.get(target_language, "English")

    model = _get_model()
    if model is None:
        logger.info("Gemini unavailable for translation — returning original text.")
        return text

    try:
        prompt = _TRANSLATE_PROMPT.format(
            source_lang_name=source_name,
            target_lang_name=target_name,
            text=text,
        )
        response = model.generate_content(prompt)
        translated = response.text.strip()
        if translated:
            return translated
        return text
    except Exception as exc:
        logger.warning(f"Translation failed ({source_language} → {target_language}): {exc}")
        return text


async def translate_to_english(text: str) -> str:
    """
    Translate any supported language text to English for AI processing.
    Falls back to original text if Gemini is unavailable.
    """
    model = _get_model()
    if model is None:
        return text

    try:
        prompt = _TO_ENGLISH_PROMPT.format(text=text)
        response = model.generate_content(prompt)
        translated = response.text.strip()
        return translated if translated else text
    except Exception as exc:
        logger.warning(f"To-English translation failed: {exc}")
        return text


def get_greeting(language: str) -> str:
    """Return a localised greeting for the AI assistant."""
    return _GREETINGS.get(language, _GREETINGS["en"])


def is_supported_language(language: str) -> bool:
    return language in SUPPORTED_LANGUAGES
