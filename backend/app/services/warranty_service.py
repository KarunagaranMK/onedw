"""
Warranty service — create, retrieve, and claim warranties.
"""
import logging
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.schemas.issue_schema import WarrantyCreateSchema

logger = logging.getLogger("onedw.warranty")


def _to_oid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format.")


def _serialize_warranty(doc: dict) -> dict:
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    for field in ("booking_id", "customer_id", "worker_id"):
        if field in doc and not isinstance(doc[field], str):
            doc[field] = str(doc[field])
    return doc


async def create_warranty(db, payload: WarrantyCreateSchema, customer_id: str) -> dict:
    booking = await db.bookings.find_one({"_id": _to_oid(payload.booking_id)})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Not your booking.")
    if booking.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Warranty can only be created for completed bookings.")

    existing = await db.warranties.find_one({"booking_id": payload.booking_id})
    if existing:
        raise HTTPException(status_code=409, detail="Warranty already exists for this booking.")

    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=payload.duration_days)

    issue_images = []
    if booking.get("issue_details"):
        issue_images = [
            img.get("url", "") for img in booking["issue_details"].get("issue_images", [])
        ]

    doc = {
        "_id": ObjectId(),
        "booking_id": payload.booking_id,
        "customer_id": customer_id,
        "worker_id": booking.get("worker_id", ""),
        "service_type": booking.get("service_type", ""),
        "duration_days": payload.duration_days,
        "start_date": now,
        "end_date": end_date,
        "covered_services": payload.covered_services or [booking.get("service_type", "")],
        "status": "active",
        "issue_photos": issue_images,
        "notes": payload.notes or "",
        "created_at": now,
    }

    await db.warranties.insert_one(doc)

    await db.bookings.update_one(
        {"_id": _to_oid(payload.booking_id)},
        {"$set": {"warranty": {
            "warranty_id": str(doc["_id"]),
            "duration_days": payload.duration_days,
            "start_date": now.isoformat(),
            "end_date": end_date.isoformat(),
            "status": "active",
        }}},
    )

    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, customer_id,
            "Warranty Activated 🛡️",
            f"Your {payload.duration_days}-day warranty is now active for {booking.get('service_type', 'service')}.",
            "success", payload.booking_id,
        )
    except Exception:
        pass

    return _serialize_warranty(doc)


async def get_booking_warranty(db, booking_id: str) -> dict | None:
    warranty = await db.warranties.find_one({"booking_id": booking_id})
    return _serialize_warranty(warranty) if warranty else None


async def get_customer_warranties(db, customer_id: str) -> list:
    cursor = db.warranties.find({"customer_id": customer_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=50)
    return [_serialize_warranty(d) for d in docs]


async def claim_warranty(db, warranty_id: str, customer_id: str, description: str, images: list = None) -> dict:
    warranty = await db.warranties.find_one({"_id": _to_oid(warranty_id)})
    if not warranty:
        raise HTTPException(status_code=404, detail="Warranty not found.")
    if warranty.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Not your warranty.")

    now = datetime.now(timezone.utc)
    if now > warranty.get("end_date", now):
        await db.warranties.update_one(
            {"_id": _to_oid(warranty_id)},
            {"$set": {"status": "expired"}},
        )
        raise HTTPException(status_code=400, detail="This warranty has expired.")

    claim_doc = {
        "_id": ObjectId(),
        "warranty_id": warranty_id,
        "booking_id": warranty.get("booking_id", ""),
        "customer_id": customer_id,
        "worker_id": warranty.get("worker_id", ""),
        "description": description,
        "images": [img.model_dump(mode="json") if hasattr(img, 'model_dump') else (dict(img) if hasattr(img, 'keys') else img) for img in images] if images else [],
        "status": "pending",
        "created_at": now,
    }
    await db.warranty_claims.insert_one(claim_doc)

    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, warranty.get("worker_id"),
            "Warranty Claim Filed 🛡️",
            f"A warranty claim has been filed for {warranty.get('service_type', 'service')}.",
            "warning", warranty.get("booking_id"),
        )
    except Exception:
        pass

    return {
        "id": str(claim_doc["_id"]),
        "status": "pending",
        "message": "Warranty claim submitted successfully. The worker will be notified.",
    }
