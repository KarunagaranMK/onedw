"""
Gemini AI integration service.
Handles:
  - Phase 3: Voice NLP parsing (text → structured service request fields)
  - Phase 6: AI worker recommendation (ranked list with reason + confidence)

NOTE: Falls back gracefully to local parsing when Gemini quota is exceeded (429).
"""
import json
import logging
import re
from typing import Optional

from app.config import settings
from app.schemas.ai_schema import (
    NLPProcessResponse,
    AIRecommendResponse,
    AIRecommendRequest,
)

logger = logging.getLogger("onedw.gemini")

# ─── Gemini Model Loader ──────────────────────────────────────────────────────

def _get_model():
    """Lazy-init Gemini model; returns None if API key is not configured."""
    if not settings.gemini_api_key:
        return None
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=settings.gemini_api_key)
        for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"]:
            try:
                return genai.GenerativeModel(model_name)
            except Exception:
                continue
        return None
    except Exception as exc:
        logger.error(f"Failed to initialise Gemini model: {exc}")
        return None


def _extract_json(text: str) -> dict:
    """Try to parse JSON from a Gemini response, stripping markdown fences."""
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    return json.loads(cleaned)


# ─── Phase 3: Local NLP Fallback ─────────────────────────────────────────────

_SERVICE_KEYWORDS = {
    "electrician": "Electrician",
    "electric": "Electrician",
    "wiring": "Electrician",
    "plumber": "Plumber",
    "plumbing": "Plumber",
    "pipe": "Plumber",
    "tap": "Plumber",
    "painter": "Painter",
    "painting": "Painter",
    "paint": "Painter",
    "cleaner": "Cleaner",
    "cleaning": "Cleaner",
    "clean": "Cleaner",
    "mechanic": "Mechanic",
    "car": "Mechanic",
    "vehicle": "Mechanic",
    "carpenter": "Carpenter",
    "carpentry": "Carpenter",
    "furniture": "Carpenter",
    "wood": "Carpenter",
    "ac": "AC Technician",
    "air condition": "AC Technician",
    "cooler": "AC Technician",
    "appliance": "Appliance Repair",
}

_TIME_PATTERNS = [
    (r"\b(\d{1,2})\s*(am|pm)\b", lambda m: (
        f"{int(m.group(1)) + 12 if m.group(2) == 'pm' and int(m.group(1)) != 12 else m.group(1):>02}:00"
    )),
    (r"\b(\d{1,2}):(\d{2})\s*(am|pm)?\b", lambda m: (
        f"{int(m.group(1)) + 12 if m.group(3) == 'pm' and int(m.group(1)) != 12 else m.group(1):>02}:{m.group(2)}"
    )),
    (r"\b(\d{2}):(\d{2})\b", lambda m: f"{m.group(1)}:{m.group(2)}"),
]

_DATE_KEYWORDS = {
    "today": "today",
    "tomorrow": "tomorrow",
    "day after tomorrow": "day after tomorrow",
}

def _local_parse_nlp(text: str) -> dict:
    """Pure-Python NLP parser — no external API calls needed."""
    lower = text.lower()
    result = {"service": None, "location": None, "date": None, "time": None}

    # Service detection
    for keyword, service in _SERVICE_KEYWORDS.items():
        if keyword in lower:
            result["service"] = service
            break

    # Date detection
    for phrase, label in _DATE_KEYWORDS.items():
        if phrase in lower:
            result["date"] = label
            break

    # Time detection
    for pattern, formatter in _TIME_PATTERNS:
        m = re.search(pattern, lower)
        if m:
            try:
                result["time"] = formatter(m)
            except Exception:
                pass
            break

    # Location detection — look for "in/at/near <location>" pattern
    loc_match = re.search(
        r"\b(?:in|at|near|around|from)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:on|at|for|tomorrow|today|by|before)|\.|,|$)",
        text,
    )
    if loc_match:
        result["location"] = loc_match.group(1).strip()
    else:
        # Fallback: look for capitalised proper nouns at end of sentence
        words = text.split()
        for word in reversed(words):
            if word and word[0].isupper() and len(word) > 2 and word.isalpha():
                if word.lower() not in {"i", "the", "a", "an", "need", "want", "please", "help", "fix", "my"}:
                    result["location"] = word
                    break

    return result


# ─── Phase 3: NLP Voice Parsing ──────────────────────────────────────────────

_NLP_PROMPT_TEMPLATE = """
You are a service request parser for a home services platform.
Extract the following fields from the user's natural language text and return ONLY valid JSON with no other text.

Fields to extract:
- service: The type of home service (e.g. Electrician, Plumber, Painter, Cleaner, Mechanic, Carpenter, AC Repair). If unclear, return null.
- location: The location/area mentioned. If none, return null.
- date: The date mentioned in YYYY-MM-DD format if an exact date, or a descriptive word like "tomorrow", "today", etc. If none, return null.
- time: The time mentioned in HH:MM 24-hour format. If none, return null.

User text: "{text}"

Return ONLY this JSON structure:
{{"service": "...", "location": "...", "date": "...", "time": "..."}}
"""


async def parse_voice_text(text: str) -> NLPProcessResponse:
    """
    Parse a natural-language voice transcript into structured request fields.
    Uses local regex NLP first; falls back to Gemini if available.
    If Gemini returns 429 (quota exceeded), falls back to local regex result.
    """
    # Always run local parser as baseline
    local_result = _local_parse_nlp(text)

    model = _get_model()
    if model is None:
        logger.info("Gemini unavailable — using local NLP parser.")
        return NLPProcessResponse(raw_text=text, **local_result)

    try:
        prompt = _NLP_PROMPT_TEMPLATE.format(text=text)
        response = model.generate_content(prompt)
        parsed = _extract_json(response.text)
        return NLPProcessResponse(
            raw_text=text,
            service=parsed.get("service") or local_result["service"],
            location=parsed.get("location") or local_result["location"],
            date=parsed.get("date") or local_result["date"],
            time=parsed.get("time") or local_result["time"],
        )
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "quota" in err_str.lower() or "RESOURCE_EXHAUSTED" in err_str:
            logger.warning("Gemini quota exceeded — falling back to local NLP parser.")
        else:
            logger.error(f"Gemini NLP parsing failed: {exc}")
        # Fall back to local result so voice always works
        return NLPProcessResponse(raw_text=text, **local_result)


# ─── Phase 6: AI Worker Recommendation ──────────────────────────────────────

_RECOMMEND_PROMPT_TEMPLATE = """
You are an AI assistant for a home services platform. Select the best worker for a customer job.

Service type requested: {service_type}
Customer location: ({lat}, {lon})

Available workers (JSON array):
{workers_json}

Evaluate each worker based on:
1. Relevance of their skills to the service type
2. Average rating (higher is better)
3. Experience in years (more is better)
4. Distance from customer in km (closer is better)
5. Availability (must be true)

Return ONLY valid JSON with no other text:
{{
  "top_worker_id": "<worker_id>",
  "reason": "<1-2 sentence explanation>",
  "confidence": <float 0.0-1.0>,
  "ranking": ["<worker_id1>", "<worker_id2>", ...]
}}
"""


def _heuristic_recommend(candidates) -> AIRecommendResponse:
    """Local heuristic worker recommendation when Gemini is unavailable."""
    def score(w):
        return w.average_rating * 2 - w.distance_km * 0.1 + w.experience_years * 0.3

    ranked = sorted(candidates, key=score, reverse=True)
    top = ranked[0]
    return AIRecommendResponse(
        top_worker_id=top.worker_id,
        reason=f"{top.name} has a {top.average_rating:.1f}⭐ rating with {top.experience_years} years of experience and is only {top.distance_km:.1f} km away.",
        confidence=round(min(score(top) / 10, 1.0), 2),
        ranking=[w.worker_id for w in ranked],
    )


async def recommend_worker(request: AIRecommendRequest) -> AIRecommendResponse:
    """
    Use Gemini to rank workers and pick the best match.
    Falls back to heuristic ranking when Gemini is unavailable or quota exceeded.
    """
    candidates = [c for c in request.candidates if c.is_available]
    if not candidates:
        return AIRecommendResponse(
            top_worker_id="",
            reason="No available workers found for this service.",
            confidence=0.0,
            ranking=[],
        )

    model = _get_model()
    if model is None:
        return _heuristic_recommend(candidates)

    try:
        workers_json = json.dumps(
            [
                {
                    "worker_id": c.worker_id,
                    "name": c.name,
                    "skills": c.skills,
                    "experience_years": c.experience_years,
                    "average_rating": c.average_rating,
                    "total_jobs": c.total_jobs,
                    "distance_km": c.distance_km,
                    "is_available": c.is_available,
                }
                for c in candidates
            ],
            indent=2,
        )
        prompt = _RECOMMEND_PROMPT_TEMPLATE.format(
            service_type=request.service_type,
            lat=request.customer_latitude,
            lon=request.customer_longitude,
            workers_json=workers_json,
        )
        response = model.generate_content(prompt)
        parsed = _extract_json(response.text)
        return AIRecommendResponse(
            top_worker_id=parsed["top_worker_id"],
            reason=parsed["reason"],
            confidence=float(parsed.get("confidence", 0.85)),
            ranking=parsed.get("ranking", [parsed["top_worker_id"]]),
        )
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "quota" in err_str.lower() or "RESOURCE_EXHAUSTED" in err_str:
            logger.warning("Gemini quota exceeded — using heuristic fallback for recommendation.")
        else:
            logger.error(f"Gemini recommendation failed: {exc}")
        return _heuristic_recommend(candidates)
