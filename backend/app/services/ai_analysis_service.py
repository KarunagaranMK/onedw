"""
AI image analysis service using Gemini Vision — enhanced.
Returns: problem, confidence, severity, estimated_cost,
         suggested_worker, required_materials, safety_advice.
Accepts base64 image data directly (no external URL fetch required).
"""
import json
import re
import base64
import logging
from typing import Optional
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger("onedw.ai_analysis")

LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "ml": "Malayalam",
}

_IMAGE_ANALYSIS_PROMPT = """You are an expert home service diagnostic AI for a platform called OneDW (India).
Analyze the uploaded image of a home repair/service issue carefully.

Service type context: {service_type}
Response language: {language_name}

Return ONLY valid JSON with this EXACT structure (no other text):
{{
    "problem": "Clear one-sentence description of the main problem visible",
    "confidence": 0.87,
    "severity": "Low|Medium|High|Critical",
    "estimated_cost": "₹XXX – ₹XXX (Indian Rupees)",
    "suggested_worker": "Type of specialist needed (e.g. Plumber, Electrician)",
    "required_materials": ["Material 1", "Material 2", "Material 3"],
    "safety_advice": ["Safety tip 1", "Safety tip 2"],
    "possible_problems": ["Problem 1", "Problem 2", "Problem 3"],
    "estimated_difficulty": "Easy|Medium|Hard|Expert",
    "estimated_duration": "e.g. 1-2 hours, Half day, Full day",
    "additional_notes": "Any other relevant observations in {language_name}"
}}

Severity guide: Low=cosmetic, Medium=functional issue, High=safety concern, Critical=immediate danger.
Confidence is your certainty 0.0-1.0. Be specific and practical.
Keep required_materials and safety_advice lists to max 4 items.
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
        logger.error("Failed to init Gemini for image analysis: %s", exc)
        return None


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    return json.loads(cleaned)


def _heuristic_analysis(service_type: str) -> dict:
    """Local heuristic fallback when Gemini is unavailable."""
    service_issues = {
        "Plumber": {
            "problem": "Water leakage or pipe issue detected",
            "confidence": 0.5,
            "severity": "Medium",
            "estimated_cost": "₹300 – ₹1,200",
            "suggested_worker": "Plumber",
            "required_materials": ["PVC pipe", "Pipe sealant", "Wrench set"],
            "safety_advice": ["Turn off main water valve", "Avoid electrical outlets near water"],
            "possible_problems": ["Pipe leakage", "Water pressure issue", "Drain blockage"],
            "estimated_difficulty": "Medium",
            "estimated_duration": "1-2 hours",
            "additional_notes": "On-site inspection recommended for accurate diagnosis.",
        },
        "Electrician": {
            "problem": "Electrical wiring or switch malfunction detected",
            "confidence": 0.5,
            "severity": "High",
            "estimated_cost": "₹400 – ₹1,500",
            "suggested_worker": "Licensed Electrician",
            "required_materials": ["Electrical wire", "Insulation tape", "Circuit breaker"],
            "safety_advice": ["Turn off main power before inspection", "Do not touch exposed wires"],
            "possible_problems": ["Wiring fault", "Switch malfunction", "Circuit overload"],
            "estimated_difficulty": "Medium",
            "estimated_duration": "1-3 hours",
            "additional_notes": "Safety inspection required by a licensed professional.",
        },
        "Carpenter": {
            "problem": "Wood damage or furniture structural issue",
            "confidence": 0.5,
            "severity": "Low",
            "estimated_cost": "₹500 – ₹2,000",
            "suggested_worker": "Carpenter",
            "required_materials": ["Wood glue", "Screws", "Sandpaper", "Varnish"],
            "safety_advice": ["Keep children away from sharp tools", "Wear protective gloves"],
            "possible_problems": ["Wood damage", "Joint loose", "Fitting misalignment"],
            "estimated_difficulty": "Medium",
            "estimated_duration": "2-4 hours",
            "additional_notes": "Material costs may vary based on wood type.",
        },
        "Painter": {
            "problem": "Paint peeling, wall cracks, or moisture damage",
            "confidence": 0.5,
            "severity": "Low",
            "estimated_cost": "₹10 – ₹30 per sq.ft",
            "suggested_worker": "Painter",
            "required_materials": ["Wall putty", "Primer", "Emulsion paint", "Roller brush"],
            "safety_advice": ["Ensure ventilation during painting", "Cover furniture"],
            "possible_problems": ["Paint peeling", "Wall cracks", "Moisture damage"],
            "estimated_difficulty": "Easy",
            "estimated_duration": "Half day",
            "additional_notes": "Surface preparation is key for lasting results.",
        },
        "AC Repair": {
            "problem": "AC cooling issue or compressor malfunction",
            "confidence": 0.5,
            "severity": "Medium",
            "estimated_cost": "₹500 – ₹2,500",
            "suggested_worker": "AC Technician",
            "required_materials": ["Refrigerant gas", "Air filter", "Capacitor"],
            "safety_advice": ["Do not try to refill gas yourself", "Clean filters regularly"],
            "possible_problems": ["Coolant leak", "Compressor issue", "Filter clogged"],
            "estimated_difficulty": "Hard",
            "estimated_duration": "1-2 hours",
            "additional_notes": "Annual AC servicing prevents most common issues.",
        },
        "Cleaning": {
            "problem": "Heavy staining or accumulated dirt requires deep cleaning",
            "confidence": 0.5,
            "severity": "Low",
            "estimated_cost": "₹500 – ₹2,000",
            "suggested_worker": "Professional Cleaner",
            "required_materials": ["Cleaning solution", "Microfiber cloths", "Scrubbing brush"],
            "safety_advice": ["Ventilate room during chemical cleaning", "Wear gloves"],
            "possible_problems": ["Heavy staining", "Dust accumulation", "Deep cleaning needed"],
            "estimated_difficulty": "Easy",
            "estimated_duration": "2-4 hours",
            "additional_notes": "Regular cleaning prevents major build-up.",
        },
    }
    default = {
        "problem": "Issue requires on-site inspection",
        "confidence": 0.4,
        "severity": "Medium",
        "estimated_cost": "₹300 – ₹1,500",
        "suggested_worker": service_type or "General Technician",
        "required_materials": ["Tools as determined by technician"],
        "safety_advice": ["Do not attempt DIY repair", "Keep area clear"],
        "possible_problems": ["Issue requires professional diagnosis"],
        "estimated_difficulty": "Medium",
        "estimated_duration": "1-2 hours",
        "additional_notes": "Contact OneDW support for immediate assistance.",
    }
    return service_issues.get(service_type, default)


async def analyze_image_base64(
    image_base64: str,
    image_mime_type: str = "image/jpeg",
    service_type: Optional[str] = None,
    language: str = "en",
) -> dict:
    """Analyze an issue image from base64 data using Gemini Vision."""
    service_type = service_type or "General"
    language_name = LANGUAGE_NAMES.get(language, "English")
    now = datetime.now(timezone.utc).isoformat()

    model = _get_model()
    if model is None:
        result = _heuristic_analysis(service_type)
        result["analyzed_at"] = now
        return result

    try:
        image_bytes = base64.b64decode(image_base64)
        prompt = _IMAGE_ANALYSIS_PROMPT.format(
            service_type=service_type,
            language_name=language_name,
        )
        response = model.generate_content([
            prompt,
            {"mime_type": image_mime_type, "data": image_bytes},
        ])
        parsed = _extract_json(response.text)
        parsed["analyzed_at"] = now
        # Ensure all expected fields are present
        parsed.setdefault("problem", "Analysis complete")
        parsed.setdefault("confidence", 0.8)
        parsed.setdefault("severity", "Medium")
        parsed.setdefault("required_materials", [])
        parsed.setdefault("safety_advice", [])
        parsed.setdefault("possible_problems", [])
        return parsed
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "quota" in err_str.lower():
            logger.warning("Gemini quota exceeded for image analysis — using heuristic fallback.")
        else:
            logger.error("Gemini image analysis failed: %s", exc)
        result = _heuristic_analysis(service_type)
        result["analyzed_at"] = now
        return result


# Keep the old URL-based function for backward compatibility
async def analyze_image(image_url: str, service_type: Optional[str] = None) -> dict:
    """Analyze an issue image using Gemini Vision (URL-based). Falls back to heuristic."""
    service_type = service_type or "General"
    model = _get_model()
    now = datetime.now(timezone.utc).isoformat()
    if model is None:
        result = _heuristic_analysis(service_type)
        result["analyzed_at"] = now
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

        prompt = _IMAGE_ANALYSIS_PROMPT.format(service_type=service_type, language_name="English")
        response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_data}])
        parsed = _extract_json(response.text)
        parsed["analyzed_at"] = now
        return parsed
    except Exception as exc:
        err_str = str(exc)
        if "429" in err_str or "quota" in err_str.lower():
            logger.warning("Gemini quota exceeded for image analysis — using heuristic fallback.")
        else:
            logger.error("Gemini image analysis failed: %s", exc)
        result = _heuristic_analysis(service_type)
        result["analyzed_at"] = now
        return result
