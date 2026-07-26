"""
Business logic for the customer review system.
"""
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from app.schemas.review_schema import ReviewCreateSchema, AdminReplySchema


def _sid(oid) -> str:
    return str(oid) if oid else ""


def _serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = _sid(out.pop("_id", ""))
    return out


async def create_customer_review(
    db: AsyncIOMotorDatabase,
    payload: ReviewCreateSchema,
    customer_id: str,
) -> dict:
    """Allow a customer to review a worker after a completed booking."""
    # Validate booking exists and is completed
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(payload.booking_id)})
    except (InvalidId, Exception):
        booking = None

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="You can only review after a booking is completed.",
        )
    if str(booking.get("customer_id", "")) != customer_id:
        raise HTTPException(status_code=403, detail="This booking does not belong to you.")

    # Prevent duplicate reviews
    existing = await db.reviews.find_one({
        "booking_id": payload.booking_id,
        "customer_id": customer_id,
    })
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this booking.")

    # Fetch customer name
    try:
        customer = await db.users.find_one({"_id": ObjectId(customer_id)})
        customer_name = customer.get("name", "") if customer else ""
    except Exception:
        customer_name = ""

    doc = {
        "booking_id": payload.booking_id,
        "worker_id": payload.worker_id,
        "customer_id": customer_id,
        "customer_name": customer_name,
        "service_name": booking.get("service_type", ""),
        "overall_rating": payload.overall_rating,
        "work_quality": payload.work_quality,
        "professionalism": payload.professionalism,
        "communication": payload.communication,
        "punctuality": payload.punctuality,
        "value_for_money": payload.value_for_money,
        "cleanliness": payload.cleanliness,
        "would_recommend": payload.would_recommend,
        "review_text": payload.review_text,
        "review_images": payload.review_images,
        "review_video": payload.review_video,
        "is_hidden": False,
        "is_verified": True,
        "admin_reply": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.reviews.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Update worker's aggregate rating
    await _update_worker_rating(db, payload.worker_id)

    return _serialize(doc)


async def _update_worker_rating(db: AsyncIOMotorDatabase, worker_id: str):
    """Recalculate and persist the worker's average rating and review count."""
    pipeline = [
        {"$match": {"worker_id": worker_id, "is_hidden": False}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$overall_rating"},
            "total_reviews": {"$sum": 1},
        }},
    ]
    agg = await db.reviews.aggregate(pipeline).to_list(length=1)
    if agg:
        avg = round(agg[0]["avg_rating"], 2)
        count = agg[0]["total_reviews"]
        try:
            await db.workers.update_one(
                {"user_id": worker_id},
                {"$set": {"average_rating": avg, "total_reviews": count}},
            )
        except Exception:
            pass


async def get_reviews(
    db: AsyncIOMotorDatabase,
    worker_id: str = None,
    customer_id: str = None,
    min_rating: int = None,
    include_hidden: bool = False,
    skip: int = 0,
    limit: int = 20,
) -> list[dict]:
    query = {}
    if worker_id:
        query["worker_id"] = worker_id
    if customer_id:
        query["customer_id"] = customer_id
    if min_rating:
        query["overall_rating"] = {"$gte": min_rating}
    if not include_hidden:
        query["is_hidden"] = False

    cursor = db.reviews.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


async def get_review_by_id(db: AsyncIOMotorDatabase, review_id: str) -> dict:
    try:
        doc = await db.reviews.find_one({"_id": ObjectId(review_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid review ID.")
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found.")
    return _serialize(doc)


async def admin_hide_review(db: AsyncIOMotorDatabase, review_id: str, hide: bool) -> dict:
    try:
        oid = ObjectId(review_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid review ID.")
    doc = await db.reviews.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found.")
    await db.reviews.update_one({"_id": oid}, {"$set": {"is_hidden": hide}})
    # Re-aggregate worker rating
    worker_id = doc.get("worker_id", "")
    if worker_id:
        await _update_worker_rating(db, worker_id)
    updated = await db.reviews.find_one({"_id": oid})
    return _serialize(updated)


async def admin_delete_review(db: AsyncIOMotorDatabase, review_id: str) -> None:
    try:
        oid = ObjectId(review_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid review ID.")
    doc = await db.reviews.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found.")
    worker_id = doc.get("worker_id", "")
    await db.reviews.delete_one({"_id": oid})
    if worker_id:
        await _update_worker_rating(db, worker_id)


async def admin_reply_to_review(
    db: AsyncIOMotorDatabase, review_id: str, payload: AdminReplySchema
) -> dict:
    try:
        oid = ObjectId(review_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid review ID.")
    doc = await db.reviews.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found.")
    await db.reviews.update_one(
        {"_id": oid},
        {"$set": {"admin_reply": payload.reply_text, "admin_reply_at": datetime.now(timezone.utc)}},
    )
    updated = await db.reviews.find_one({"_id": oid})
    return _serialize(updated)


async def get_my_reviews(db: AsyncIOMotorDatabase, customer_id: str) -> list[dict]:
    cursor = db.reviews.find({"customer_id": customer_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


async def create_worker_review(
    db: AsyncIOMotorDatabase,
    payload,
    worker_id: str,
) -> dict:
    """Allow a worker to review a customer after a completed booking."""
    # Validate booking exists and is completed
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(payload.booking_id)})
    except Exception:
        booking = None

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="You can only review after a booking is completed.",
        )
    if str(booking.get("worker_id", "")) != worker_id:
        raise HTTPException(status_code=403, detail="This booking does not belong to you.")

    # Prevent duplicate worker reviews
    existing = await db.worker_reviews.find_one({
        "booking_id": payload.booking_id,
        "worker_id": worker_id,
    })
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this booking.")

    # Fetch worker name
    try:
        worker_user = await db.users.find_one({"_id": ObjectId(worker_id)})
        worker_name = worker_user.get("name", "") if worker_user else ""
    except Exception:
        worker_name = ""

    doc = {
        "booking_id": payload.booking_id,
        "customer_id": payload.customer_id,
        "worker_id": worker_id,
        "worker_name": worker_name,
        "communication": payload.communication,
        "cooperation": payload.cooperation,
        "payment_experience": payload.payment_experience,
        "safety": payload.safety,
        "overall_experience": payload.overall_experience,
        "positive_feedback": payload.positive_feedback,
        "suggestions": payload.suggestions,
        "report_misbehavior": payload.report_misbehavior,
        "misbehavior_note": payload.misbehavior_note,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.worker_reviews.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def get_public_reviews(
    db: AsyncIOMotorDatabase,
    service: str = None,
    min_rating: int = None,
    skip: int = 0,
    limit: int = 20,
) -> list[dict]:
    """Public: return visible reviews for the OneDW reviews page."""
    query: dict = {"is_hidden": False}
    if service:
        query["service_name"] = {"$regex": service, "$options": "i"}
    if min_rating:
        query["overall_rating"] = {"$gte": min_rating}
    cursor = db.reviews.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]
