from datetime import datetime, timezone
from bson import ObjectId


def build_worker_profile_document(user_id: str) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "_id": ObjectId(),
        "user_id": user_id,
        "service_type": "",
        "skills": [],
        "experience_years": 0,
        "hourly_rate": 0.0,
        "bio": "",
        "languages": [],
        "availability": [],
        "working_hours": {"start": "09:00", "end": "18:00"},
        "emergency_contact": "",
        "whatsapp_number": "",
        "address": "",
        "latitude": None,
        "longitude": None,
        "profile_photo": "",
        "identity_proof_type": "",
        "identity_proof_url": "",
        "is_available": True,
        "average_rating": 0.0,
        "total_jobs": 0,
        "status": "offline",
        "verified": False,
        "profile_complete": False,
        "created_at": now,
        "updated_at": now,
    }
