"""
Business logic for the complaint management system.
"""
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from app.schemas.complaint_schema import (
    ComplaintCreateSchema, ComplaintMessageSchema, ComplaintStatusUpdateSchema
)


def _serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    return out


async def create_complaint(
    db: AsyncIOMotorDatabase,
    payload: ComplaintCreateSchema,
    complainant_id: str,
) -> dict:
    """Create a new complaint from a customer or worker."""
    # Fetch complainant info
    try:
        user = await db.users.find_one({"_id": ObjectId(complainant_id)})
        complainant_name = user.get("name", "") if user else ""
        complainant_role = user.get("role", "") if user else ""
    except Exception:
        complainant_name = ""
        complainant_role = ""

    doc = {
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "priority": payload.priority,
        "status": "open",
        "booking_id": payload.booking_id,
        "complainant_id": complainant_id,
        "complainant_name": complainant_name,
        "complainant_role": complainant_role,
        "against_id": None,
        "against_name": "",
        "images": payload.images,
        "videos": payload.videos,
        "documents": payload.documents,
        "assigned_to": None,
        "resolution_note": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.complaints.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def get_my_complaints(db: AsyncIOMotorDatabase, user_id: str) -> list[dict]:
    """Fetch all complaints filed by the given user, newest first."""
    cursor = db.complaints.find({"complainant_id": user_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


async def get_all_complaints(
    db: AsyncIOMotorDatabase,
    status_filter: str = None,
    priority_filter: str = None,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    """Admin: list all complaints with optional filters."""
    query = {}
    if status_filter:
        query["status"] = status_filter
    if priority_filter:
        query["priority"] = priority_filter
    cursor = db.complaints.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


async def get_complaint_by_id(
    db: AsyncIOMotorDatabase, complaint_id: str, requester_id: str = None
) -> dict:
    try:
        oid = ObjectId(complaint_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")
    doc = await db.complaints.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    # Non-admins can only view their own complaints
    if requester_id and str(doc.get("complainant_id", "")) != requester_id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return _serialize(doc)


async def update_complaint_status(
    db: AsyncIOMotorDatabase,
    complaint_id: str,
    payload: ComplaintStatusUpdateSchema,
) -> dict:
    try:
        oid = ObjectId(complaint_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")
    update: dict = {
        "status": payload.status,
        "updated_at": datetime.now(timezone.utc),
    }
    if payload.note:
        update["resolution_note"] = payload.note
    if payload.assigned_to:
        update["assigned_to"] = payload.assigned_to
    result = await db.complaints.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    updated = await db.complaints.find_one({"_id": oid})
    return _serialize(updated)


async def add_complaint_message(
    db: AsyncIOMotorDatabase,
    complaint_id: str,
    payload: ComplaintMessageSchema,
    sender_id: str,
) -> dict:
    """Append a chat message to a complaint thread."""
    # Verify complaint exists
    try:
        await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")

    try:
        user = await db.users.find_one({"_id": ObjectId(sender_id)})
        sender_name = user.get("name", "") if user else ""
        sender_role = user.get("role", "") if user else ""
    except Exception:
        sender_name = ""
        sender_role = ""

    msg_doc = {
        "complaint_id": complaint_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "sender_role": sender_role,
        "message": payload.message,
        "attachments": payload.attachments,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.complaint_messages.insert_one(msg_doc)
    msg_doc["_id"] = result.inserted_id
    # Update complaint's updated_at
    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    return _serialize(msg_doc)


async def get_complaint_messages(
    db: AsyncIOMotorDatabase, complaint_id: str
) -> list[dict]:
    cursor = db.complaint_messages.find({"complaint_id": complaint_id}).sort("created_at", 1)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]
