"""
Business logic for customer ratings — submission and aggregation.
Extended with category ratings and media uploads.
"""
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from app.schemas.rating_schema import RatingCreateSchema
from app.models.rating_model import build_rating_document


def _to_oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format.")


def _serialize_rating(doc: dict) -> dict:
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc


async def create_rating(
    db: AsyncIOMotorDatabase, payload: RatingCreateSchema, customer_id: str
) -> dict:
    booking = await db.bookings.find_one(
        {"_id": _to_oid(payload.booking_id), "customer_id": customer_id}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed bookings.")

    existing = await db.ratings.find_one(
        {"booking_id": payload.booking_id, "customer_id": customer_id}
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already rated this booking.")

    stars_value = payload.rating or payload.stars or 5
    comment_value = payload.review or payload.comment or ""

    doc = build_rating_document(
        booking_id=payload.booking_id,
        customer_id=customer_id,
        worker_id=payload.worker_id,
        stars=stars_value,
        comment=comment_value,
    )

    if payload.punctuality:
        doc["punctuality"] = payload.punctuality
    if payload.behavior:
        doc["behavior"] = payload.behavior
    if payload.work_quality:
        doc["work_quality"] = payload.work_quality
    if payload.communication:
        doc["communication"] = payload.communication
    if payload.value_for_money:
        doc["value_for_money"] = payload.value_for_money
    if payload.cleanliness:
        doc["cleanliness"] = payload.cleanliness
    if payload.review:
        doc["review"] = payload.review
    doc["recommend"] = payload.recommend
    doc["review_images"] = [img.model_dump() for img in payload.review_images]
    doc["review_videos"] = [vid.model_dump() for vid in payload.review_videos]

    result = await db.ratings.insert_one(doc)
    doc["_id"] = result.inserted_id

    await _update_worker_average_rating(db, payload.worker_id)

    return _serialize_rating(doc)


async def _update_worker_average_rating(db: AsyncIOMotorDatabase, worker_id: str):
    cursor = db.ratings.find({"worker_id": worker_id})
    all_ratings = await cursor.to_list(length=10000)
    if all_ratings:
        avg = sum(r.get("stars", r.get("rating", 5)) for r in all_ratings) / len(all_ratings)
        avg_rounded = round(avg, 2)

        await db.workers.update_one(
            {"user_id": worker_id},
            {"$set": {
                "average_rating": avg_rounded,
                "rating": avg_rounded,
                "total_reviews": len(all_ratings),
                "updated_at": datetime.now(timezone.utc),
            }},
        )


async def get_worker_ratings(db: AsyncIOMotorDatabase, worker_id: str) -> list[dict]:
    cursor = db.ratings.find({"worker_id": worker_id}).sort("created_at", -1)
    ratings = await cursor.to_list(length=None)
    return [_serialize_rating(r) for r in ratings]


async def get_my_ratings(db: AsyncIOMotorDatabase, customer_id: str) -> list[dict]:
    cursor = db.ratings.find({"customer_id": customer_id}).sort("created_at", -1)
    ratings = await cursor.to_list(length=None)
    return [_serialize_rating(r) for r in ratings]
