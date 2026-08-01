"""
AI Smart Chat service — enhanced with:
  - Structured 7-field Gemini diagnostic response
  - MongoDB chat history persistence
  - Multilingual support (translate in/out)
"""
import re
import json
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger("onedw.ai_chat")

# ─── Emergency Keywords ───────────────────────────────────────────────────────

EMERGENCY_KEYWORDS = [
    "gas leak", "gas leaking", "gas smell",
    "electric spark", "sparks", "short circuit", "electrical fire",
    "fire", "smoke coming",
    "burst pipe", "pipe burst", "major water leak", "flooding",
    "carbon monoxide", "switchboard sparking", "sparking",
]

SERVICE_KEYWORDS = {
    "electrician": ["electric", "wiring", "socket", "switch", "fan", "light", "fuse", "voltage", "power", "sparking", "switchboard"],
    "plumber": ["pipe", "tap", "toilet", "water tank", "drainage", "leak", "drain", "water leakage"],
    "ac technician": ["ac", "air conditioning", "cooler", "hvac", "cooling", "air condition"],
    "carpenter": ["furniture", "door", "window", "wood", "shelf", "cabinet"],
    "painter": ["paint", "wall", "colour", "color", "brush"],
    "cleaner": ["clean", "dust", "mop", "sweep", "sanitize", "hygiene"],
    "appliance repair": ["appliance", "washing machine", "refrigerator", "fridge", "microwave", "oven", "noise"],
}

SERVICE_TIPS = {
    "electrician": [
        "Turn off the main power switch before the worker arrives.",
        "Keep children and pets away from the work area.",
        "Have your last electricity bill ready for the worker.",
    ],
    "plumber": [
        "Locate and turn off the water main if there is active leaking.",
        "Clear the area around the affected pipe or fixture.",
        "Collect any standing water to prevent further damage.",
    ],
    "ac technician": [
        "Note any error codes shown on your AC unit.",
        "Ensure clear access to the indoor and outdoor units.",
        "Have the AC model and installation date ready.",
    ],
    "carpenter": [
        "Clear the workspace of valuables and fragile items.",
        "Have measurements of the area ready if possible.",
    ],
    "painter": [
        "Remove or cover furniture before the painter arrives.",
        "Choose paint colors in advance if possible.",
    ],
    "cleaner": [
        "Store away valuable or fragile items before cleaning.",
        "Inform the cleaner about any areas that need special attention.",
    ],
    "appliance repair": [
        "Unplug the appliance before the technician arrives.",
        "Note the model number and any error codes displayed.",
        "Describe the noise or malfunction in detail.",
    ],
}

PRICE_ESTIMATES = {
    "electrician": "₹200 – ₹800 (basic), ₹1,000+ (wiring/installation)",
    "plumber": "₹150 – ₹600 (basic repair), ₹800+ (pipe replacement)",
    "ac technician": "₹300 – ₹1,200 (service/repair)",
    "carpenter": "₹400 – ₹2,000 (depends on work scope)",
    "painter": "₹10 – ₹30 per sq.ft",
    "cleaner": "₹500 – ₹2,000 (deep clean)",
    "appliance repair": "₹300 – ₹1,500",
}

REPAIR_TIMES = {
    "electrician": "1 – 3 hours",
    "plumber": "1 – 2 hours",
    "ac technician": "1 – 2 hours",
    "carpenter": "2 – 4 hours",
    "painter": "Half day – Full day",
    "cleaner": "2 – 4 hours",
    "appliance repair": "1 – 2 hours",
}

FAQ_RESPONSES = {
    "how long": "Most basic jobs take 1–3 hours. Larger tasks like painting or full wiring may take 1–2 days.",
    "how much": "Pricing varies by service. Electricians: ₹200–₹800, Plumbers: ₹150–₹600, Cleaners: ₹500–₹2,000.",
    "availability": "Workers are available 7 days a week from 8 AM to 8 PM. Emergency slots are 24/7.",
    "cancel": "You can cancel a booking up to 2 hours before the scheduled time at no charge.",
    "payment": "We accept UPI, card, net banking, and OneDW wallet. Cash payment is also available.",
    "warranty": "All work comes with a 30-day service warranty. Contact support to raise a warranty claim.",
    "verified": "All OneDW workers are background-checked, ID-verified, and trained before being listed.",
    "emergency": "For emergencies, select the Emergency priority when booking — a worker is dispatched within 60 minutes.",
}

LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "ml": "Malayalam",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _detect_emergency(text: str) -> tuple[bool, list[str]]:
    lower = text.lower()
    found = [kw for kw in EMERGENCY_KEYWORDS if kw in lower]
    return bool(found), found


def _detect_service(text: str) -> Optional[str]:
    lower = text.lower()
    scores = {}
    for service, keywords in SERVICE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score:
            scores[service] = score
    if not scores:
        return None
    return max(scores, key=scores.get)


def _estimate_severity(text: str, is_emergency: bool) -> int:
    if is_emergency:
        return 5
    lower = text.lower()
    high_words = ["urgent", "broken", "not working", "completely", "immediately", "severe"]
    medium_words = ["problem", "issue", "need", "help", "fix", "repair", "noise", "leakage"]
    if any(w in lower for w in high_words):
        return 4
    if any(w in lower for w in medium_words):
        return 3
    return 2


def _check_faq(text: str) -> Optional[str]:
    lower = text.lower()
    for trigger, answer in FAQ_RESPONSES.items():
        if trigger in lower:
            return answer
    return None


def _extract_json(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()
    return json.loads(cleaned)


def _build_local_reply(text: str, service: Optional[str], is_emergency: bool,
                       emergency_kws: list, severity: int, faq_answer: Optional[str]) -> dict:
    """Build structured local fallback response."""
    if is_emergency:
        kw_str = " and ".join(emergency_kws[:2])
        reply = (
            f"🚨 **EMERGENCY DETECTED** — I noticed you mentioned *{kw_str}*. "
            f"Please ensure everyone is safe and evacuate if necessary. "
            f"I'm flagging this booking as HIGH PRIORITY. "
            f"A verified {service or 'professional'} will be dispatched to you as soon as possible. "
            f"**If this is a life-threatening emergency, also call 112 (Emergency Services).**"
        )
        return {
            "reply": reply,
            "recommended_service": service.title() if service else None,
            "severity_rating": 5,
            "emergency_flag": True,
            "emergency_keywords": emergency_kws,
            "pre_booking_tips": SERVICE_TIPS.get(service, []) if service else [],
            "estimated_price_range": PRICE_ESTIMATES.get(service) if service else None,
            "suggested_worker_category": service.title() if service else None,
            "problem_detected": f"Emergency: {kw_str}",
            "possible_causes": ["Immediate hazard detected — professional inspection required"],
            "recommended_worker": (service or "Emergency Technician").title(),
            "safety_tips": [
                "Evacuate the area immediately if unsafe.",
                "Turn off main power / gas / water supply.",
                "Call 112 for life-threatening emergencies.",
            ],
            "estimated_repair_cost": PRICE_ESTIMATES.get(service),
            "estimated_repair_time": REPAIR_TIMES.get(service),
            "preventive_maintenance_tips": ["Schedule regular professional inspection every 6 months."],
        }

    if faq_answer:
        return {
            "reply": f"Great question! {faq_answer} Is there anything else I can help you with?",
            "recommended_service": None,
            "severity_rating": severity,
            "emergency_flag": False,
            "emergency_keywords": [],
            "pre_booking_tips": [],
            "estimated_price_range": None,
            "suggested_worker_category": None,
            "problem_detected": None,
            "possible_causes": [],
            "recommended_worker": None,
            "safety_tips": [],
            "estimated_repair_cost": None,
            "estimated_repair_time": None,
            "preventive_maintenance_tips": [],
        }

    if service:
        tips = SERVICE_TIPS.get(service, [])
        price = PRICE_ESTIMATES.get(service, "₹150–₹1,500 depending on the job")
        repair_time = REPAIR_TIMES.get(service, "1–3 hours")
        tip_text = (" Here are some tips while you wait: " + " | ".join(tips[:2])) if tips else ""
        reply = (
            f"I understand you need a **{service.title()}**.{tip_text} "
            f"Estimated cost: **{price}**. "
            f"I can help you book the best available {service.title()} near you. "
            f"Would you like me to find top-rated workers right now?"
        )
        return {
            "reply": reply,
            "recommended_service": service.title(),
            "severity_rating": severity,
            "emergency_flag": False,
            "emergency_keywords": [],
            "pre_booking_tips": tips,
            "estimated_price_range": price,
            "suggested_worker_category": service.title(),
            "problem_detected": f"Service needed: {service.title()}",
            "possible_causes": ["Wear and tear", "Lack of maintenance", "Sudden malfunction"],
            "recommended_worker": service.title(),
            "safety_tips": tips[:3],
            "estimated_repair_cost": price,
            "estimated_repair_time": repair_time,
            "preventive_maintenance_tips": [
                f"Schedule annual {service.title()} maintenance.",
                "Keep a record of all repairs done.",
                "Request warranty paperwork from the worker.",
            ],
        }

    return {
        "reply": (
            "Hello! I'm your OneDW AI assistant 👋. I can help you with:\n"
            "• **Booking a service** — electrician, plumber, AC repair, cleaning, and more\n"
            "• **Emergency assistance** — gas leaks, burst pipes, electrical sparks\n"
            "• **Pricing estimates** — fair cost for any home service\n"
            "• **Booking queries** — cancellations, warranties, payments\n\n"
            "Just describe your problem and I'll find the best solution!"
        ),
        "recommended_service": None,
        "severity_rating": severity,
        "emergency_flag": False,
        "emergency_keywords": [],
        "pre_booking_tips": [],
        "estimated_price_range": None,
        "suggested_worker_category": None,
        "problem_detected": None,
        "possible_causes": [],
        "recommended_worker": None,
        "safety_tips": [],
        "estimated_repair_cost": None,
        "estimated_repair_time": None,
        "preventive_maintenance_tips": [],
    }


# ─── Gemini Chat ──────────────────────────────────────────────────────────────

_STRUCTURED_CHAT_PROMPT = """You are OneDW's expert AI assistant for home services (India).
Emergency detected: {emergency}.
Service type detected: {service}.
User's preferred language: {language_name}.
Previous conversation:
{history}
User message: {message}

Respond in {language_name}. Provide a warm, helpful response in this EXACT JSON format (no other text):
{{
  "reply": "Main conversational reply in {language_name} (2-4 sentences, friendly tone)",
  "problem_detected": "One-line description of the problem",
  "possible_causes": ["Cause 1", "Cause 2", "Cause 3"],
  "recommended_worker": "Type of specialist (e.g. Electrician, Plumber)",
  "safety_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "estimated_repair_cost": "Indian Rupee range (e.g. ₹500 – ₹1,500)",
  "estimated_repair_time": "Duration (e.g. 1–2 hours)",
  "preventive_maintenance_tips": ["Tip 1", "Tip 2"],
  "emergency_flag": false,
  "severity_rating": 3
}}

If this is a general greeting or FAQ, still return the JSON but set problem_detected to null.
If emergency, set emergency_flag to true and severity_rating to 5.
severity_rating: 1=very low, 2=low, 3=medium, 4=high, 5=critical/emergency.
Keep all list fields to a maximum of 3 items.
"""


async def process_chat(message: str, conversation_history: list = None,
                       language: str = "en") -> dict:
    """Main chat handler — returns structured AI response with all 7 diagnostic fields."""
    is_emergency, emergency_kws = _detect_emergency(message)
    service = _detect_service(message)
    severity = _estimate_severity(message, is_emergency)
    faq_answer = _check_faq(message)
    language_name = LANGUAGE_NAMES.get(language, "English")

    # Try Gemini for structured response
    try:
        from app.config import settings
        if settings.gemini_api_key:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            model = None
            for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]:
                try:
                    model = genai.GenerativeModel(model_name)
                    break
                except Exception:
                    continue

            if model:
                history_str = ""
                if conversation_history:
                    for msg in (conversation_history or [])[-4:]:
                        role = msg.get("role", "user")
                        content = msg.get("content", "")
                        history_str += f"{role}: {content}\n"

                prompt = _STRUCTURED_CHAT_PROMPT.format(
                    emergency=is_emergency,
                    service=service or "unknown",
                    language=language,
                    language_name=language_name,
                    history=history_str or "No previous conversation.",
                    message=message,
                )

                response = model.generate_content(prompt)
                parsed = _extract_json(response.text)

                return {
                    "reply": parsed.get("reply", ""),
                    "recommended_service": parsed.get("recommended_worker") or (service.title() if service else None),
                    "severity_rating": parsed.get("severity_rating", severity),
                    "emergency_flag": parsed.get("emergency_flag", is_emergency),
                    "emergency_keywords": emergency_kws,
                    "pre_booking_tips": SERVICE_TIPS.get(service, []) if service else [],
                    "estimated_price_range": parsed.get("estimated_repair_cost") or (PRICE_ESTIMATES.get(service) if service else None),
                    "suggested_worker_category": parsed.get("recommended_worker") or (service.title() if service else None),
                    "problem_detected": parsed.get("problem_detected"),
                    "possible_causes": parsed.get("possible_causes", []),
                    "recommended_worker": parsed.get("recommended_worker"),
                    "safety_tips": parsed.get("safety_tips", []),
                    "estimated_repair_cost": parsed.get("estimated_repair_cost"),
                    "estimated_repair_time": parsed.get("estimated_repair_time"),
                    "preventive_maintenance_tips": parsed.get("preventive_maintenance_tips", []),
                }
    except Exception as exc:
        logger.warning(f"Gemini structured chat failed, using local response: {exc}")

    # Local fallback
    return _build_local_reply(message, service, is_emergency, emergency_kws, severity, faq_answer)


# ─── MongoDB Chat History ─────────────────────────────────────────────────────

async def save_chat_history(session_id: str, messages: list, language: str = "en",
                             user_id: Optional[str] = None) -> bool:
    """Persist chat history to MongoDB ai_chat_history collection."""
    try:
        from app.database.connection import get_database
        db = get_database()
        now = datetime.now(timezone.utc).isoformat()
        existing = await db.ai_chat_history.find_one({"session_id": session_id})
        if existing:
            await db.ai_chat_history.update_one(
                {"session_id": session_id},
                {"$set": {
                    "messages": messages,
                    "language": language,
                    "updated_at": now,
                    **({"user_id": user_id} if user_id else {}),
                }},
            )
        else:
            await db.ai_chat_history.insert_one({
                "session_id": session_id,
                "user_id": user_id,
                "messages": messages,
                "language": language,
                "created_at": now,
                "updated_at": now,
            })
        return True
    except Exception as exc:
        logger.error(f"Failed to save chat history: {exc}")
        return False


async def get_chat_history(session_id: str) -> Optional[dict]:
    """Retrieve chat history from MongoDB by session ID."""
    try:
        from app.database.connection import get_database
        db = get_database()
        doc = await db.ai_chat_history.find_one({"session_id": session_id})
        if not doc:
            return None
        doc.pop("_id", None)
        return doc
    except Exception as exc:
        logger.error(f"Failed to get chat history: {exc}")
        return None
