"""
AI image analysis service using Gemini Vision.
Analyzes uploaded issue images and provides diagnostic suggestions.
"""
import json
import re
import logging
from typing import Optional
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger("onedw.ai_analysis")

_IMAGE_ANALYSIS_PROMPT = """
You are an expert home service diagnostic AI for a platform called OneDW.
Analyze the uploaded image of a home repair/service issue and provide a detailed diagnosis.

Service type context: {service_type}

Return ONLY valid JSON with this exact structure:
{{
    "possible_problems": ["Problem 1", "Problem 2", "Problem 3"],
    "estimated_difficulty": "Easy|Medium|Hard|Expert",
    "recommended_worker": "Type of specialist needed",
    "estimated_duration": "e.g. 1-2 hours, Half day, Full day",
    "confidence_score": 0.85,
    "additional_notes": "Any relevant observations"
}}

Be specific and practical. Consider common issues for the given service type.
"""


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
        logger.error("Failed to init Gemini for image analysis: %s", exc)
        return None


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    return json.loads(cleaned)


def _heuristic_analysis(service_type: str) -> dict:
    """Local heuristic fallback when Gemini is unavailable."""
    service_issues = {
        "Plumber": {
            "possible_problems": ["Pipe leakage", "Water pressure issue", "Drain blockage"],
            "estimated_difficulty": "Medium",
            "recommended_worker": "Plumber",
            "estimated_duration": "1-2 hours",
        },
        "Electrician": {
            "possible_problems": ["Wiring fault", "Switch malfunction", "Circuit overload"],
            "estimated_difficulty": "Medium",
            "recommended_worker": "Licensed Electrician",
            "estimated_duration": "1-3 hours",
        },
        "Carpenter": {
            "possible_problems": ["Wood damage", "Joint loose", "Fitting misalignment"],
            "estimated_difficulty": "Medium",
            "recommended_worker": "Carpenter",
            "estimated_duration": "2-4 hours",
        },
        "Painter": {
            "possible_problems": ["Paint peeling", "Wall cracks", "Moisture damage"],
            "estimated_difficulty": "Easy",
            "recommended_worker": "Painter",
            "estimated_duration": "Half day",
        },
        "AC Repair": {
            "possible_problems": ["Coolant leak", "Compressor issue", "Filter clogged"],
            "estimated_difficulty": "Hard",
            "recommended_worker": "AC Technician",
            "estimated_duration": "1-2 hours",
        },
        "Cleaning": {
            "possible_problems": ["Heavy staining", "Dust accumulation", "Deep cleaning needed"],
            "estimated_difficulty": "Easy",
            "recommended_worker": "Professional Cleaner",
            "estimated_duration": "2-4 hours",
        },
    }
    default = {
        "possible_problems": ["Issue requires on-site inspection"],
        "estimated_difficulty": "Medium",
        "recommended_worker": service_type or "General Technician",
        "estimated_duration": "1-2 hours",
    }
    result = service_issues.get(service_type, default)
    result["confidence_score"] = 0.5
    return result


async def analyze_image(image_url: str, service_type: Optional[str] = None) -> dict:
    """Analyze an issue image using Gemini Vision. Falls back to heuristic analysis."""
    service_type = service_type or "General"
    model = _get_model()
    if model is None:
        result = _heuristic_analysis(service_type)
        result["analyzed_at"] = datetime.now(timezone.utc).isoformat()
        return result

    try:
        import urllib.request
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(image_url, headers={"User-Agent": "OneDW/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
            image_data = response.read()

        prompt = _IMAGE_ANALYSIS_PROMPT.format(service_type=service_type)
        response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_data}])
        parsed = _extract_json(response.text)
        parsed["analyzed_at"] = datetime.now(timezone.utc).isoformat()
        parsed["raw_response"] = response.text
        return parsed
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "quota" in err_str.lower():
            logger.warning("Gemini quota exceeded for image analysis — using heuristic fallback.")
        else:
            logger.error("Gemini image analysis failed: %s", exc)
        result = _heuristic_analysis(service_type)
        result["analyzed_at"] = datetime.now(timezone.utc).isoformat()
        return result
