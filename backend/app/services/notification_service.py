"""
Notification service — create, list, and mark as read.
"""
from datetime import datetime, timezone
from bson import ObjectId


async def get_my_notifications(db, user_id: str) -> list:
    """Get all notifications for a user, newest first."""
    cursor = db.notifications.find({"user_id": str(user_id)}).sort("created_at", -1)
    docs = await cursor.to_list(length=50)
    return [_serialize(n) for n in docs]


async def mark_read(db, notification_id: str, user_id: str) -> dict:
    """Mark a single notification as read."""
    try:
        oid = ObjectId(notification_id)
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid notification ID.")
    await db.notifications.update_one(
        {"_id": oid, "user_id": str(user_id)},
        {"$set": {"read": True}},
    )
    return {"success": True}


async def mark_all_read(db, user_id: str) -> dict:
    """Mark all notifications for a user as read."""
    await db.notifications.update_many(
        {"user_id": str(user_id), "read": False},
        {"$set": {"read": True}},
    )
    return {"success": True}



async def create_notification(
    db,
    user_id: str,
    title: str,
    body: str,
    ntype: str = "info",
    booking_id: str = None,
) -> dict:
    """Create a new notification (used internally by other services)."""
    doc = {
        "_id": ObjectId(),
        "user_id": str(user_id),
        "title": title,
        "body": body,
        "type": ntype,
        "read": False,
        "booking_id": booking_id,
        "created_at": datetime.now(timezone.utc),
    }
    await db.notifications.insert_one(doc)
    return _serialize(doc)


async def get_unread_count(db, user_id: str) -> int:
    return await db.notifications.count_documents({"user_id": str(user_id), "read": False})


def _serialize(n: dict) -> dict:
    return {
        "id": str(n.get("_id", "")),
        "user_id": n.get("user_id", ""),
        "title": n.get("title", ""),
        "body": n.get("body", ""),
        "type": n.get("type", "info"),
        "read": n.get("read", False),
        "booking_id": n.get("booking_id"),
        "created_at": n.get("created_at"),
    }
