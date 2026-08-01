"""
Notification service — create, list, mark as read, delete, category filtering.
Phase 19: Added category support, delete, stats.
"""
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException


async def get_my_notifications(db, user_id: str, category: str = None) -> list:
    """Get all notifications for a user, newest first. Optionally filter by category."""
    query = {"user_id": str(user_id)}
    if category and category != "all":
        query["category"] = category
    cursor = db.notifications.find(query).sort("created_at", -1).limit(100)
    docs = await cursor.to_list(length=100)
    return [_serialize(n) for n in docs]


async def mark_read(db, notification_id: str, user_id: str) -> dict:
    """Mark a single notification as read."""
    try:
        oid = ObjectId(notification_id)
    except Exception:
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


async def delete_notification(db, notification_id: str, user_id: str) -> dict:
    """Delete a single notification for a user."""
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID.")
    result = await db.notifications.delete_one({"_id": oid, "user_id": str(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"success": True}


async def delete_all_notifications(db, user_id: str) -> dict:
    """Delete all notifications for a user."""
    result = await db.notifications.delete_many({"user_id": str(user_id)})
    return {"success": True, "deleted_count": result.deleted_count}


async def get_notification_stats(db, user_id: str) -> dict:
    """Return unread counts per category and total unread count."""
    pipeline = [
        {"$match": {"user_id": str(user_id), "read": False}},
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
        }},
    ]
    result = await db.notifications.aggregate(pipeline).to_list(length=None)
    total_unread = sum(r["count"] for r in result)
    by_category = {r["_id"] or "general": r["count"] for r in result}
    return {
        "total_unread": total_unread,
        "by_category": by_category,
    }


async def create_notification(
    db,
    user_id: str,
    title: str,
    body: str,
    ntype: str = "info",
    booking_id: str = None,
    category: str = None,
) -> dict:
    """Create a new notification (used internally by other services).
    
    Category options: booking | wallet | payment | refund | emergency |
                      promotion | maintenance | warranty | loyalty | system | general
    """
    # Auto-derive category from ntype if not explicitly set
    if not category:
        category_map = {
            "booking":     "booking",
            "wallet":      "wallet",
            "payment":     "payment",
            "refund":      "refund",
            "emergency":   "emergency",
            "promotion":   "promotion",
            "maintenance": "maintenance",
            "warranty":    "warranty",
            "loyalty":     "loyalty",
            "system":      "system",
        }
        category = category_map.get(ntype, "general")

    doc = {
        "_id": ObjectId(),
        "user_id": str(user_id),
        "title": title,
        "body": body,
        "type": ntype,
        "category": category,
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
        "category": n.get("category", "general"),
        "read": n.get("read", False),
        "booking_id": n.get("booking_id"),
        "created_at": n.get("created_at"),
    }
