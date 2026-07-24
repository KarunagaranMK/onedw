"""
Worker search and discovery service.
Ensures every registered professional stored in MongoDB is searchable by customers.
"""
import math
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.schemas.worker_search_schema import WorkerSearchFilters, WorkerPublicProfile


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


async def _serialize(worker_doc: dict, user_doc: dict = None, dist: Optional[float] = None) -> dict:
    user_doc = user_doc or {}
    return {
        "id": str(worker_doc.get("_id", "")),
        "name": worker_doc.get("name") or user_doc.get("name", "Professional Worker"),
        "email": worker_doc.get("email") or user_doc.get("email", ""),
        "phone": worker_doc.get("phone") or user_doc.get("phone", ""),
        "service_type": worker_doc.get("service_type") or (worker_doc.get("skills", ["Professional"])[0] if worker_doc.get("skills") else "Professional"),
        "skills": worker_doc.get("skills", []),
        "experience_years": worker_doc.get("experience_years", 0),
        "hourly_rate": worker_doc.get("hourly_rate", 0.0),
        "bio": worker_doc.get("bio", ""),
        "languages": worker_doc.get("languages", []),
        "availability": worker_doc.get("availability", []),
        "working_hours": worker_doc.get("working_hours", {"start": "09:00", "end": "18:00"}),
        "address": worker_doc.get("address", ""),
        "latitude": worker_doc.get("latitude"),
        "longitude": worker_doc.get("longitude"),
        "profile_photo": worker_doc.get("profile_photo", ""),
        "average_rating": worker_doc.get("average_rating", 0.0),
        "total_jobs": worker_doc.get("total_jobs", 0),
        "is_available": worker_doc.get("is_available", True),
        "verified": worker_doc.get("verified", False),
        "distance_km": round(dist, 2) if dist is not None else None,
        "created_at": worker_doc.get("created_at"),
    }


async def get_all_workers(db: AsyncIOMotorDatabase) -> list:
    """Fetch all registered workers in MongoDB."""
    workers = await db.workers.find({}).to_list(length=None)
    result = []
    for w in workers:
        user = None
        user_id = w.get("user_id")
        if user_id:
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
            except Exception:
                try:
                    user = await db.users.find_one({"_id": user_id})
                except Exception:
                    pass
        result.append(await _serialize(w, user))
    return result


async def search_workers(db: AsyncIOMotorDatabase, filters: WorkerSearchFilters) -> list:
    """Search workers stored in MongoDB matching service, location, rating, price, etc."""
    query = {}
    if filters.is_available is not None:
        query["is_available"] = filters.is_available
    if filters.min_experience:
        query["experience_years"] = {"$gte": filters.min_experience}
    if filters.min_rating:
        query["average_rating"] = {"$gte": filters.min_rating}
    if filters.max_price:
        query["hourly_rate"] = {"$lte": filters.max_price}
    # NOTE: min_price is intentionally NOT applied as a DB filter here.
    # Customers want affordable workers; min_price would exclude cheap workers.
    # Frontend slider represents max_price budget, not minimum.

    workers = await db.workers.find(query).to_list(length=None)
    result = []

    service_query = (filters.service or "").lower().strip()
    text_query = (filters.query or "").lower().strip()   # free-text: name, location, skill

    for w in workers:
        # ── Service type / profession matching ──────────────────────────────
        if service_query:
            svc = (w.get("service_type") or "").lower()
            skills = [s.lower() for s in (w.get("skills") or [])]
            bio = (w.get("bio") or "").lower()
            first_word = service_query.split()[0]
            matches = (
                service_query in svc or svc in service_query or
                first_word in svc or
                any(service_query in s or s in service_query or first_word in s for s in skills) or
                service_query in bio
            )
            if not matches:
                continue

        # ── Free-text query: name, address, location, skills, bio ───────────
        if text_query:
            name = (w.get("name") or "").lower()
            addr = (w.get("address") or "").lower()
            skills = [s.lower() for s in (w.get("skills") or [])]
            bio = (w.get("bio") or "").lower()
            text_matches = (
                text_query in name or
                text_query in addr or
                text_query in bio or
                any(text_query in s for s in skills)
            )
            if not text_matches:
                continue

        user = None
        user_id = w.get("user_id")
        if user_id:
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
            except Exception:
                try:
                    user = await db.users.find_one({"_id": user_id})
                except Exception:
                    pass

            # Also match free-text against user's name if worker name is missing
            if text_query and user:
                user_name = (user.get("name") or "").lower()
                if not w.get("name") and text_query not in user_name:
                    continue

        dist = None
        if filters.lat and filters.lon and w.get("latitude") and w.get("longitude"):
            dist = _haversine_km(filters.lat, filters.lon, w["latitude"], w["longitude"])
            if filters.radius_km and dist > filters.radius_km:
                continue

        result.append(await _serialize(w, user, dist))

    result.sort(key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 9999))
    return result



async def get_worker_by_id(db: AsyncIOMotorDatabase, worker_id: str) -> dict:
    from fastapi import HTTPException
    from bson.errors import InvalidId
    worker = None
    try:
        worker = await db.workers.find_one({"_id": ObjectId(worker_id)})
    except Exception:
        pass
    if not worker:
        worker = await db.workers.find_one({"user_id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    user = None
    user_id = worker.get("user_id")
    if user_id:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            pass

    ratings = await db.ratings.find({"worker_id": worker_id}).to_list(length=20) if hasattr(db, "ratings") else []
    serialized = await _serialize(worker, user)
    serialized["reviews"] = [
        {
            "rating": r.get("rating", r.get("stars", 0)),
            "review": r.get("review", r.get("comment", "")),
            "created_at": r.get("created_at"),
        }
        for r in ratings
    ]
    return serialized
