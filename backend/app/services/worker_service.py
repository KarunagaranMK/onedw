"""
Business logic for worker profiles, location, and job management.
"""
import math
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from app.schemas.worker_schema import WorkerProfileUpdateSchema, WorkerLocationSchema
from app.models.worker_model import build_worker_profile_document


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _to_oid(worker_id: str) -> ObjectId:
    try:
        return ObjectId(worker_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid worker ID.")


async def _get_user(db, user_id: str) -> dict:
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


async def _ensure_worker_profile(db, user_id: str) -> dict:
    profile = await db.workers.find_one({"user_id": user_id})
    if profile is None:
        doc = build_worker_profile_document(user_id)
        result = await db.workers.insert_one(doc)
        doc["_id"] = result.inserted_id
        profile = doc
    return profile


def _serialize_worker(user: dict, profile: dict) -> dict:
    return {
        "id": str(profile.get("_id", "")),
        "user_id": str(user.get("_id", "")),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": profile.get("phone") or user.get("phone", ""),
        "service_type": profile.get("service_type", ""),
        "skills": profile.get("skills", []),
        "experience_years": profile.get("experience_years", 0),
        "hourly_rate": profile.get("hourly_rate", 0.0),
        "bio": profile.get("bio", ""),
        "languages": profile.get("languages", []),
        "availability": profile.get("availability", []),
        "working_hours": profile.get("working_hours", {"start": "09:00", "end": "18:00"}),
        "emergency_contact": profile.get("emergency_contact", ""),
        "whatsapp_number": profile.get("whatsapp_number", ""),
        "address": profile.get("address", ""),
        "latitude": profile.get("latitude"),
        "longitude": profile.get("longitude"),
        "profile_photo": profile.get("profile_photo", ""),
        "identity_proof_type": profile.get("identity_proof_type", ""),
        "identity_proof_url": profile.get("identity_proof_url", ""),
        "is_available": profile.get("is_available", True),
        "average_rating": profile.get("average_rating", 0.0),
        "total_jobs": profile.get("total_jobs", 0),
        "status": profile.get("status", "offline"),
        "verified": profile.get("verified", False),
        "profile_complete": profile.get("profile_complete", False),
        "created_at": profile.get("created_at"),
        "updated_at": profile.get("updated_at"),
    }


async def get_worker_profile(db, user_id: str) -> dict:
    user = await _get_user(db, user_id)
    profile = await _ensure_worker_profile(db, user_id)
    return _serialize_worker(user, profile)


async def update_worker_profile(db, user_id: str, payload: WorkerProfileUpdateSchema) -> dict:
    user = await _get_user(db, user_id)
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    # If service_type is being set, also update skills
    if "service_type" in update_data and update_data["service_type"]:
        service = update_data["service_type"]
        if "skills" not in update_data or not update_data.get("skills"):
            update_data["skills"] = [service]
    
    # Determine if profile is complete
    profile = await db.workers.find_one({"user_id": user_id})
    merged = {**(profile or {}), **update_data}
    profile_complete = bool(
        merged.get("service_type") and
        merged.get("experience_years", 0) > 0 and
        merged.get("hourly_rate", 0) > 0
    )
    update_data["profile_complete"] = profile_complete
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.workers.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True,
    )
    profile = await db.workers.find_one({"user_id": user_id})
    if not profile:
        profile = build_worker_profile_document(user_id)
        profile.update(update_data)
    return _serialize_worker(user, profile)


async def update_worker_location(db, user_id: str, payload: WorkerLocationSchema) -> dict:
    await db.workers.update_one(
        {"user_id": user_id},
        {"$set": {"latitude": payload.latitude, "longitude": payload.longitude, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"message": "Location updated.", "latitude": payload.latitude, "longitude": payload.longitude}


async def update_worker_status(db, user_id: str, status_value: str) -> dict:
    await db.workers.update_one(
        {"user_id": user_id},
        {"$set": {"status": status_value, "is_available": status_value == "online", "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"status": status_value}


async def get_available_jobs(db, user_id: str, service_type: str = None, radius_km: float = 50) -> list:
    profile = await db.workers.find_one({"user_id": user_id})
    worker_lat = profile.get("latitude") if profile else None
    worker_lon = profile.get("longitude") if profile else None

    query = {"status": "pending"}
    if service_type:
        query["service_type"] = {"$regex": service_type, "$options": "i"}

    cursor = db.requests.find(query).sort("created_at", -1)
    requests = await cursor.to_list(length=None)

    result = []
    for req in requests:
        # Safe _id handling
        raw_id = req.get("_id")
        req["id"] = str(raw_id) if raw_id else str(ObjectId())
        req.pop("_id", None)

        if worker_lat and worker_lon and req.get("latitude") and req.get("longitude"):
            req["distance_km"] = round(_haversine_km(worker_lat, worker_lon, req["latitude"], req["longitude"]), 2)
        else:
            req["distance_km"] = None
        result.append(req)

    result.sort(key=lambda r: r.get("distance_km") or float("inf"))
    return result


async def get_nearby_workers(db, service_type: str, customer_lat: float, customer_lon: float, radius_km: float = 200) -> list:
    all_workers = await db.workers.find({"is_available": True}).to_list(length=None)
    service_lower = service_type.lower().strip()

    def _skill_matches(skills):
        for skill in skills:
            s = skill.lower()
            if service_lower in s or s in service_lower:
                return True
        first_word = service_lower.split()[0]
        return any(first_word in skill.lower() for skill in skills)

    def _build_result(profile, user, dist):
        return {
            "worker_id": str(user["_id"]),
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "phone": profile.get("phone") or user.get("phone", ""),
            "skills": profile.get("skills", []),
            "service_type": profile.get("service_type", ""),
            "experience_years": profile.get("experience_years", 0),
            "hourly_rate": profile.get("hourly_rate", 0.0),
            "bio": profile.get("bio", ""),
            "average_rating": profile.get("average_rating", 0.0),
            "total_jobs": profile.get("total_jobs", 0),
            "latitude": profile.get("latitude"),
            "longitude": profile.get("longitude"),
            "distance_km": round(dist, 2),
            "is_available": profile.get("is_available", True),
            "profile_photo": profile.get("profile_photo", ""),
        }

    skill_matched = []
    all_available = []

    for profile in all_workers:
        user_id_str = profile.get("user_id")
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id_str)})
        except Exception:
            user = None
        if not user:
            continue

        worker_lat = profile.get("latitude")
        worker_lon = profile.get("longitude")
        dist = _haversine_km(customer_lat, customer_lon, worker_lat, worker_lon) if (worker_lat and worker_lon) else 0
        entry = _build_result(profile, user, dist)

        if dist <= radius_km or not (worker_lat and worker_lon):
            all_available.append(entry)
        if _skill_matches(profile.get("skills", []) or ([profile.get("service_type", "")] if profile.get("service_type") else [])):
            if dist <= radius_km or not (worker_lat and worker_lon):
                skill_matched.append(entry)

    result = skill_matched if skill_matched else all_available
    result.sort(key=lambda w: w["distance_km"])
    return result
