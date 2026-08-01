"""
Chat business logic:
  - Chat sessions between customer ↔ worker
  - Message CRUD with read receipts
  - Typing indicator state
  - AI auto-reply via Gemini when worker is offline
  - Video inspection session management
  - Notifications
"""
import random
import string
import logging
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId

from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException

from app.schemas.chat_schema import (
    StartSessionSchema, SendMessageSchema,
    InspectionSummarySchema, MarkReadSchema,
)
from app.config import settings

logger = logging.getLogger("onedw.chat")

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _sid(doc: dict) -> dict:
    """Serialize MongoDB doc — convert _id to id string."""
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    return out


def _gen_jitsi_room() -> str:
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"onedw-{suffix}"


async def _get_user(db, user_id: str) -> dict:
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return user or {}
    except Exception:
        return {}


# ─── AI Auto-Reply ─────────────────────────────────────────────────────────────

async def _ai_auto_reply(message: str, worker_name: str, booking_id: Optional[str]) -> str:
    """Generate an AI reply when the worker is offline."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = f"""You are an AI assistant for OneDW home services platform.
The customer sent a message to worker '{worker_name}' who is currently offline.
{"The message is related to booking #{booking_id[:8]}." if booking_id else ""}

Customer message: {message}

Reply helpfully on behalf of the worker. Keep response under 150 words.
Cover: booking ETA, service details, pricing, or general questions.
Sign off as: "— AI Assistant (on behalf of {worker_name})"
"""
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"AI auto-reply failed: {e}")
        return (
            f"Hi! {worker_name} is currently offline. "
            "Your message has been delivered and they will respond soon. "
            "For urgent issues, please call our support line. "
            f"— AI Assistant (on behalf of {worker_name})"
        )


# ─── Chat Sessions ─────────────────────────────────────────────────────────────

async def get_or_create_session(db: AsyncIOMotorDatabase, customer_id: str, payload: StartSessionSchema) -> dict:
    """Get existing chat session or create a new one."""
    # Try to find existing session
    existing = await db.chat_sessions.find_one({
        "customer_id": customer_id,
        "worker_id": payload.worker_id,
    })
    if existing:
        return _sid(existing)

    now = datetime.now(timezone.utc)
    # Fetch names
    customer = await _get_user(db, customer_id)
    worker   = await _get_user(db, payload.worker_id)

    doc = {
        "customer_id": customer_id,
        "customer_name": customer.get("name", "Customer"),
        "worker_id": payload.worker_id,
        "worker_name": worker.get("name", "Worker"),
        "booking_id": payload.booking_id,
        "last_message": None,
        "last_message_at": None,
        "unread_customer": 0,
        "unread_worker": 0,
        "worker_online": False,
        "created_at": now,
    }
    result = await db.chat_sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _sid(doc)


async def list_sessions(db: AsyncIOMotorDatabase, user_id: str, role: str) -> list:
    """List all chat sessions for a user (customer or worker)."""
    field = "customer_id" if role == "customer" else "worker_id"
    cursor = db.chat_sessions.find({field: user_id}).sort("last_message_at", -1).limit(50)
    docs = await cursor.to_list(length=None)
    return [_sid(d) for d in docs]


async def get_session(db: AsyncIOMotorDatabase, session_id: str) -> dict:
    try:
        doc = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
        return _sid(doc) if doc else None
    except Exception:
        return None


# ─── Messages ─────────────────────────────────────────────────────────────────

async def send_message(
    db: AsyncIOMotorDatabase,
    session_id: str,
    sender_id: str,
    sender_name: str,
    sender_role: str,
    payload: SendMessageSchema,
) -> dict:
    """Send a message and optionally trigger AI auto-reply."""
    now = datetime.now(timezone.utc)

    # Build message doc
    msg = {
        "session_id": session_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "sender_role": sender_role,
        "content": payload.content,
        "message_type": payload.message_type,
        "image_base64": payload.image_base64,
        "voice_base64": payload.voice_base64,
        "voice_duration": payload.voice_duration,
        "is_read": False,
        "is_ai_reply": False,
        "created_at": now,
    }
    result = await db.chat_messages.insert_one(msg)
    msg["_id"] = result.inserted_id

    # Update session last_message
    unread_field = "unread_worker" if sender_role == "customer" else "unread_customer"
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {"last_message": payload.content[:80], "last_message_at": now},
            "$inc": {unread_field: 1},
        },
    )

    # Create notification for recipient
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    if session:
        recipient_id = session["worker_id"] if sender_role == "customer" else session["customer_id"]
        await db.notifications.insert_one({
            "user_id": recipient_id,
            "title": f"New message from {sender_name}",
            "body": payload.content[:100] if payload.content else "Sent an attachment",
            "type": "chat",
            "reference_id": session_id,
            "is_read": False,
            "created_at": now,
        })

    # AI auto-reply if worker is offline and sender is customer
    if sender_role == "customer" and session:
        worker_online = session.get("worker_online", False)
        if not worker_online:
            ai_content = await _ai_auto_reply(
                payload.content,
                session.get("worker_name", "the worker"),
                session.get("booking_id"),
            )
            ai_msg = {
                "session_id": session_id,
                "sender_id": "ai",
                "sender_name": "AI Assistant",
                "sender_role": "ai",
                "content": ai_content,
                "message_type": "text",
                "is_read": False,
                "is_ai_reply": True,
                "created_at": datetime.now(timezone.utc),
            }
            await db.chat_messages.insert_one(ai_msg)

    return _sid(msg)


async def get_messages(
    db: AsyncIOMotorDatabase,
    session_id: str,
    skip: int = 0,
    limit: int = 50,
) -> list:
    """Paginated message history for a session."""
    cursor = (
        db.chat_messages.find({"session_id": session_id})
        .sort("created_at", 1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=None)
    return [_sid(d) for d in docs]


async def mark_messages_read(db: AsyncIOMotorDatabase, session_id: str, reader_id: str, reader_role: str):
    """Mark all unread messages in a session as read (by the reader)."""
    # Mark messages not sent by reader as read
    await db.chat_messages.update_many(
        {"session_id": session_id, "sender_id": {"$ne": reader_id}, "is_read": False},
        {"$set": {"is_read": True}},
    )
    # Reset unread counter
    unread_field = "unread_customer" if reader_role == "customer" else "unread_worker"
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {unread_field: 0}},
    )


# ─── Typing Indicator ──────────────────────────────────────────────────────────

async def set_typing(db: AsyncIOMotorDatabase, session_id: str, user_id: str, is_typing: bool):
    """Update typing state in a lightweight doc."""
    await db.chat_typing.update_one(
        {"session_id": session_id, "user_id": user_id},
        {"$set": {"is_typing": is_typing, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


async def get_typing_state(db: AsyncIOMotorDatabase, session_id: str, user_id: str) -> dict:
    """Get other users' typing states in a session."""
    docs = await db.chat_typing.find({
        "session_id": session_id,
        "user_id": {"$ne": user_id},
        "is_typing": True,
    }).to_list(length=None)
    return {"typing_users": [d["user_id"] for d in docs]}


# ─── Worker Online Status ──────────────────────────────────────────────────────

async def set_worker_online(db: AsyncIOMotorDatabase, worker_id: str, online: bool):
    await db.chat_sessions.update_many(
        {"worker_id": worker_id},
        {"$set": {"worker_online": online}},
    )


# ─── Video Sessions ────────────────────────────────────────────────────────────

async def create_video_session(
    db: AsyncIOMotorDatabase,
    customer_id: str,
    worker_id: str,
    chat_session_id: str,
    booking_id: Optional[str] = None,
) -> dict:
    """Create a video inspection session with a unique Jitsi room."""
    now = datetime.now(timezone.utc)
    doc = {
        "chat_session_id": chat_session_id,
        "booking_id": booking_id,
        "customer_id": customer_id,
        "worker_id": worker_id,
        "jitsi_room": _gen_jitsi_room(),
        "jitsi_url": "",  # set below
        "status": "pending",
        "inspection_summary": None,
        "started_at": None,
        "ended_at": None,
        "created_at": now,
    }
    result = await db.video_sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    sid = _sid(doc)
    sid["jitsi_url"] = f"https://meet.jit.si/{doc['jitsi_room']}"
    return sid


async def get_video_session(db: AsyncIOMotorDatabase, video_session_id: str) -> dict:
    try:
        doc = await db.video_sessions.find_one({"_id": ObjectId(video_session_id)})
        if doc:
            s = _sid(doc)
            s["jitsi_url"] = f"https://meet.jit.si/{doc['jitsi_room']}"
            return s
        return None
    except Exception:
        return None


async def save_inspection_summary(
    db: AsyncIOMotorDatabase,
    video_session_id: str,
    summary: InspectionSummarySchema,
) -> dict:
    """Worker saves inspection findings after the video call."""
    await db.video_sessions.update_one(
        {"_id": ObjectId(video_session_id)},
        {
            "$set": {
                "inspection_summary": summary.model_dump(),
                "status": "ended",
                "ended_at": datetime.now(timezone.utc),
            }
        },
    )
    return await get_video_session(db, video_session_id)


# ─── Notifications ─────────────────────────────────────────────────────────────

async def get_notifications(db: AsyncIOMotorDatabase, user_id: str, limit: int = 30) -> list:
    cursor = (
        db.notifications.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    docs = await cursor.to_list(length=None)
    return [_sid(d) for d in docs]


async def mark_notifications_read(db: AsyncIOMotorDatabase, user_id: str, ids: Optional[list] = None):
    query = {"user_id": user_id}
    if ids:
        object_ids = []
        for i in ids:
            try:
                object_ids.append(ObjectId(i))
            except Exception:
                pass
        if object_ids:
            query["_id"] = {"$in": object_ids}
    await db.notifications.update_many(query, {"$set": {"is_read": True}})


async def get_unread_notification_count(db: AsyncIOMotorDatabase, user_id: str) -> int:
    return await db.notifications.count_documents({"user_id": user_id, "is_read": False})
