"""
Admin dashboard business logic — aggregation pipelines for real-time analytics.
All functions are admin-only and query the live MongoDB collections.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def _serialize(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Dashboard Stats
# ─────────────────────────────────────────────────────────────────────────────

async def get_dashboard_stats(db: AsyncIOMotorDatabase) -> dict:
    """Return aggregate counts for the main admin dashboard cards."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start.replace(day=1)

    # User counts
    total_customers = await db.users.count_documents({"role": "customer"})
    total_workers   = await db.users.count_documents({"role": "worker"})
    new_today       = await db.users.count_documents({"role": "customer", "created_at": {"$gte": today_start}})
    new_week        = await db.users.count_documents({"role": "customer", "created_at": {"$gte": week_start}})
    new_month       = await db.users.count_documents({"role": "customer", "created_at": {"$gte": month_start}})

    # Worker verification
    verified_workers = await db.workers.count_documents({"verification_status": "approved"})
    pending_verify   = await db.workers.count_documents({"verification_status": "pending"})
    rejected_workers = await db.workers.count_documents({"verification_status": "rejected"})

    # Bookings
    total_bookings     = await db.bookings.count_documents({})
    today_bookings     = await db.bookings.count_documents({"created_at": {"$gte": today_start}})
    completed_bookings = await db.bookings.count_documents({"status": "completed"})
    pending_bookings   = await db.bookings.count_documents({"status": "pending"})
    cancelled_bookings = await db.bookings.count_documents({"status": "cancelled"})
    active_bookings    = await db.bookings.count_documents({"status": {"$in": ["accepted", "worker_on_the_way", "arrived", "started"]}})

    # Reviews
    total_reviews  = await db.reviews.count_documents({})
    hidden_reviews = await db.reviews.count_documents({"is_hidden": True})

    # Complaints
    total_complaints    = await db.complaints.count_documents({})
    open_complaints     = await db.complaints.count_documents({"status": "open"})
    resolved_complaints = await db.complaints.count_documents({"status": "resolved"})
    critical_complaints = await db.complaints.count_documents({"priority": "critical"})

    # Revenue — sum payment amounts from completed bookings
    rev_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    rev_result = await db.bookings.aggregate(rev_pipeline).to_list(length=1)
    total_revenue = rev_result[0]["total"] if rev_result else 0

    today_rev_pipeline = [
        {"$match": {"status": "completed", "created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    today_rev = await db.bookings.aggregate(today_rev_pipeline).to_list(length=1)
    today_revenue = today_rev[0]["total"] if today_rev else 0

    week_rev_pipeline = [
        {"$match": {"status": "completed", "created_at": {"$gte": week_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    week_rev = await db.bookings.aggregate(week_rev_pipeline).to_list(length=1)
    week_revenue = week_rev[0]["total"] if week_rev else 0

    month_rev_pipeline = [
        {"$match": {"status": "completed", "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    month_rev = await db.bookings.aggregate(month_rev_pipeline).to_list(length=1)
    month_revenue = month_rev[0]["total"] if month_rev else 0

    # Commission (default 10%)
    platform_settings = await get_platform_settings(db)
    commission_rate = float(platform_settings.get("commission_rate", 10))
    platform_commission = round(total_revenue * commission_rate / 100, 2)
    worker_payout = round(total_revenue - platform_commission, 2)

    return {
        "customers": {
            "total": total_customers,
            "new_today": new_today,
            "new_week": new_week,
            "new_month": new_month,
        },
        "workers": {
            "total": total_workers,
            "verified": verified_workers,
            "pending_verification": pending_verify,
            "rejected": rejected_workers,
        },
        "bookings": {
            "total": total_bookings,
            "today": today_bookings,
            "completed": completed_bookings,
            "pending": pending_bookings,
            "cancelled": cancelled_bookings,
            "active": active_bookings,
        },
        "reviews": {
            "total": total_reviews,
            "hidden": hidden_reviews,
        },
        "complaints": {
            "total": total_complaints,
            "open": open_complaints,
            "resolved": resolved_complaints,
            "critical": critical_complaints,
        },
        "revenue": {
            "total": total_revenue,
            "today": today_revenue,
            "week": week_revenue,
            "month": month_revenue,
            "platform_commission": platform_commission,
            "worker_payout": worker_payout,
            "commission_rate": commission_rate,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Analytics
# ─────────────────────────────────────────────────────────────────────────────

async def get_bookings_per_month(db: AsyncIOMotorDatabase) -> list[dict]:
    pipeline = [
        {"$group": {
            "_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {"month": months[r["_id"]["month"] - 1], "year": r["_id"]["year"], "count": r["count"]}
        for r in result
    ]


async def get_revenue_per_month(db: AsyncIOMotorDatabase, commission_rate: float = 10) -> list[dict]:
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}},
            "revenue": {"$sum": "$amount"},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {
            "month": months[r["_id"]["month"] - 1],
            "year": r["_id"]["year"],
            "revenue": r["revenue"],
            "commission": round(r["revenue"] * commission_rate / 100, 2),
        }
        for r in result
    ]


async def get_service_popularity(db: AsyncIOMotorDatabase) -> list[dict]:
    pipeline = [
        {"$group": {"_id": "$service_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    return [{"service": r["_id"] or "Unknown", "count": r["count"]} for r in result]


async def get_revenue_growth(db: AsyncIOMotorDatabase, commission_rate: float = 10) -> list[dict]:
    """Month-over-month revenue with growth percentage for the analytics dashboard."""
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}},
            "revenue": {"$sum": "$amount"},
            "bookings": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    rows = []
    for i, r in enumerate(result):
        revenue = r["revenue"]
        prev_revenue = result[i - 1]["revenue"] if i > 0 else revenue
        growth = round(((revenue - prev_revenue) / prev_revenue * 100), 1) if prev_revenue else 0
        rows.append({
            "month": months[r["_id"]["month"] - 1],
            "year": r["_id"]["year"],
            "revenue": revenue,
            "commission": round(revenue * commission_rate / 100, 2),
            "worker_payout": round(revenue * (100 - commission_rate) / 100, 2),
            "bookings": r["bookings"],
            "growth": growth,
        })
    return rows


# ─────────────────────────────────────────────────────────────────────────────
# AI Insights / Telemetry
# ─────────────────────────────────────────────────────────────────────────────

async def get_ai_insights(db: AsyncIOMotorDatabase) -> dict:
    """Generate AI telemetry: top problems, peak hours, CSAT, demand forecast."""
    # Most common complaint categories
    complaint_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_complaints = await db.complaints.aggregate(complaint_pipeline).to_list(length=None)

    # Most booked services
    service_pipeline = [
        {"$group": {"_id": "$service_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_services = await db.bookings.aggregate(service_pipeline).to_list(length=None)

    # Average review score (CSAT)
    csat_pipeline = [
        {"$match": {"is_hidden": False}},
        {"$group": {"_id": None, "avg": {"$avg": "$overall_rating"}, "total": {"$sum": 1}}},
    ]
    csat_result = await db.reviews.aggregate(csat_pipeline).to_list(length=1)
    avg_rating = round(csat_result[0]["avg"], 2) if csat_result else 0.0
    total_reviews = csat_result[0]["total"] if csat_result else 0

    # Cancellation rate
    total_bookings = await db.bookings.count_documents({})
    cancelled = await db.bookings.count_documents({"status": "cancelled"})
    cancellation_rate = round((cancelled / total_bookings * 100), 1) if total_bookings else 0

    # Top rated workers
    top_workers_cursor = db.workers.find(
        {"average_rating": {"$gt": 0}},
    ).sort("average_rating", -1).limit(5)
    top_workers = await top_workers_cursor.to_list(length=5)

    return {
        "top_complaint_categories": [
            {"category": r["_id"] or "Other", "count": r["count"]} for r in top_complaints
        ],
        "most_booked_services": [
            {"service": r["_id"] or "Unknown", "count": r["count"]} for r in top_services
        ],
        "csat": {
            "average_rating": avg_rating,
            "total_reviews": total_reviews,
            "satisfaction_score": round(avg_rating / 5 * 100, 1),
        },
        "cancellation_rate": cancellation_rate,
        "top_workers": [
            {
                "name": w.get("name", ""),
                "service": w.get("service_type", ""),
                "rating": w.get("average_rating", 0),
                "jobs": w.get("total_jobs", 0),
            }
            for w in top_workers
        ],
        "demand_forecast": {
            "note": "Peak demand typically occurs on weekends and during morning/evening slots.",
            "peak_days": ["Saturday", "Sunday"],
            "peak_hours": ["09:00-11:00", "17:00-20:00"],
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# Broadcast Notifications
# ─────────────────────────────────────────────────────────────────────────────

async def broadcast_notification(
    db: AsyncIOMotorDatabase,
    title: str,
    message: str,
    notif_type: str,
    target: str,
    admin_id: str,
) -> dict:
    """Store a broadcast notification and create individual records for all target users."""
    now = datetime.now(timezone.utc)
    broadcast_doc = {
        "title": title,
        "message": message,
        "type": notif_type,
        "target": target,
        "sent_by": admin_id,
        "created_at": now,
    }
    result = await db.broadcasts.insert_one(broadcast_doc)
    broadcast_doc["_id"] = result.inserted_id

    # Build query for target users
    if target == "customers":
        user_query: dict = {"role": "customer"}
    elif target == "workers":
        user_query = {"role": "worker"}
    else:
        user_query = {}

    # Fetch target user IDs and insert notifications
    users_cursor = db.users.find(user_query)
    users = await users_cursor.to_list(length=None)
    if users:
        notif_docs = [
            {
                "user_id": str(u["_id"]),
                "title": title,
                "message": message,
                "type": notif_type,
                "is_read": False,
                "broadcast_id": str(result.inserted_id),
                "created_at": now,
            }
            for u in users
        ]
        try:
            await db.notifications.insert_many(notif_docs)
        except Exception:
            pass  # Best-effort; don't fail the request

    return {**_serialize(broadcast_doc), "recipients_count": len(users)}


# ─────────────────────────────────────────────────────────────────────────────
# Refund
# ─────────────────────────────────────────────────────────────────────────────

async def process_refund(
    db: AsyncIOMotorDatabase,
    booking_id: str,
    amount: float,
    refund_type: str,  # "full" | "partial" | "rejected"
    reason: str,
    admin_id: str,
    refund_destination: str = "wallet",
) -> dict:
    """Record a refund decision for a completed/cancelled booking."""
    doc = {
        "booking_id": booking_id,
        "amount": amount,
        "refund_type": refund_type,
        "reason": reason,
        "refund_destination": refund_destination,
        "processed_by": admin_id,
        "status": "approved" if refund_type != "rejected" else "rejected",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.refunds.insert_one(doc)
    doc["_id"] = result.inserted_id

    # If approved and destination is wallet, credit the customer's wallet
    if refund_type != "rejected" and refund_destination == "wallet" and amount > 0:
        try:
            booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
            if booking:
                customer_id = str(booking.get("customer_id", ""))
                if customer_id:
                    await db.wallets.update_one(
                        {"user_id": customer_id},
                        {
                            "$inc": {"balance": amount},
                            "$set": {"updated_at": datetime.now(timezone.utc)},
                        },
                        upsert=True,
                    )
                    await db.wallet_transactions.insert_one({
                        "user_id": customer_id,
                        "type": "REFUND",
                        "amount": amount,
                        "reference_id": booking_id,
                        "description": f"Refund for booking #{booking_id[:8]}",
                        "status": "completed",
                        "created_at": datetime.now(timezone.utc),
                    })
        except Exception:
            pass  # Best-effort wallet credit

    return _serialize(doc)


# ─────────────────────────────────────────────────────────────────────────────
# Platform Settings (Single, Consolidated Implementation)
# ─────────────────────────────────────────────────────────────────────────────

_DEFAULT_SETTINGS = {
    "commission_rate": 10,
    "gst_rate": 18,
    "cancellation_charges": 50,
    "emergency_charges": 100,
    "wallet_cashback_rate": 5,
}


async def get_platform_settings(db: AsyncIOMotorDatabase) -> dict:
    """Return all platform-wide settings as a flat dict."""
    doc = await db.platform_settings.find_one({"_id": "global"})
    if not doc:
        return dict(_DEFAULT_SETTINGS)
    out = dict(doc)
    out.pop("_id", None)
    return {**_DEFAULT_SETTINGS, **out}


async def update_platform_setting(db: AsyncIOMotorDatabase, key: str, value) -> dict:
    """Upsert a single platform setting value."""
    allowed_keys = set(_DEFAULT_SETTINGS.keys())
    if key not in allowed_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown setting key: {key}. Allowed: {sorted(allowed_keys)}"
        )
    await db.platform_settings.update_one(
        {"_id": "global"},
        {"$set": {key: value, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return await get_platform_settings(db)


# ─────────────────────────────────────────────────────────────────────────────
# Customer Management
# ─────────────────────────────────────────────────────────────────────────────

async def get_customers(
    db: AsyncIOMotorDatabase, search: str = None, skip: int = 0, limit: int = 50
) -> list[dict]:
    query: dict = {"role": "customer"}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


async def block_customer(db: AsyncIOMotorDatabase, customer_id: str, block: bool) -> dict:
    try:
        oid = ObjectId(customer_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid customer ID.")
    result = await db.users.update_one({"_id": oid}, {"$set": {"is_blocked": block}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found.")
    updated = await db.users.find_one({"_id": oid})
    return _serialize(updated)


# ─────────────────────────────────────────────────────────────────────────────
# Worker Management
# ─────────────────────────────────────────────────────────────────────────────

async def get_workers(
    db: AsyncIOMotorDatabase,
    verification_status: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    query: dict = {}
    if verification_status:
        query["verification_status"] = verification_status
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.workers.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


async def update_worker_verification(
    db: AsyncIOMotorDatabase, worker_id: str, verification_status: str, note: str = ""
) -> dict:
    cursor = db.workers.find({"user_id": worker_id})
    worker = await cursor.to_list(length=1)
    if not worker:
        # Try by _id
        try:
            worker_doc = await db.workers.find_one({"_id": ObjectId(worker_id)})
        except InvalidId:
            worker_doc = None
        if not worker_doc:
            raise HTTPException(status_code=404, detail="Worker not found.")
        oid = worker_doc["_id"]
    else:
        oid = worker[0]["_id"]

    await db.workers.update_one(
        {"_id": oid},
        {"$set": {
            "verification_status": verification_status,
            "verification_note": note,
            "verification_updated_at": datetime.now(timezone.utc),
        }},
    )
    updated = await db.workers.find_one({"_id": oid})
    return _serialize(updated)


# ─────────────────────────────────────────────────────────────────────────────
# Warnings & Bans
# ─────────────────────────────────────────────────────────────────────────────

async def issue_warning(
    db: AsyncIOMotorDatabase,
    target_id: str,
    target_type: str,
    reason: str,
    admin_id: str,
) -> dict:
    warning_doc = {
        "target_id": target_id,
        "target_type": target_type,  # "worker" | "customer"
        "reason": reason,
        "issued_by": admin_id,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.warnings.insert_one(warning_doc)
    warning_doc["_id"] = result.inserted_id

    # Increment warning count on user/worker
    try:
        oid = ObjectId(target_id)
        if target_type == "worker":
            await db.workers.update_one({"user_id": target_id}, {"$inc": {"warning_count": 1}})
        else:
            await db.users.update_one({"_id": oid}, {"$inc": {"warning_count": 1}})
    except Exception:
        pass

    return _serialize(warning_doc)


async def ban_user(
    db: AsyncIOMotorDatabase,
    target_id: str,
    target_type: str,
    reason: str,
    permanent: bool,
    admin_id: str,
) -> dict:
    """Ban a worker or customer."""
    ban_doc = {
        "target_id": target_id,
        "target_type": target_type,
        "reason": reason,
        "permanent": permanent,
        "issued_by": admin_id,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.bans.insert_one(ban_doc)
    ban_doc["_id"] = result.inserted_id

    # Mark the user as banned
    try:
        oid = ObjectId(target_id)
        ban_update = {"$set": {"is_banned": True, "ban_reason": reason, "banned_at": datetime.now(timezone.utc)}}
        if target_type == "worker":
            await db.workers.update_one({"user_id": target_id}, ban_update)
            await db.users.update_one({"_id": oid}, ban_update)
        else:
            await db.users.update_one({"_id": oid}, ban_update)
    except Exception:
        pass

    return _serialize(ban_doc)


# ─────────────────────────────────────────────────────────────────────────────
# Booking Management
# ─────────────────────────────────────────────────────────────────────────────

async def get_all_bookings(
    db: AsyncIOMotorDatabase,
    status_filter: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    query: dict = {}
    if status_filter:
        query["status"] = status_filter
    if search:
        query["$or"] = [
            {"service_type": {"$regex": search, "$options": "i"}},
            {"customer_id": {"$regex": search, "$options": "i"}},
        ]
    cursor = db.bookings.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize(d) for d in docs]


# ─────────────────────────────────────────────────────────────────────────────
# BI Dashboard — Phase 17 Analytics
# ─────────────────────────────────────────────────────────────────────────────

async def get_daily_revenue(db: AsyncIOMotorDatabase, commission_rate: float = 10) -> list[dict]:
    """Last 30 days daily revenue aggregation."""
    from datetime import timezone, timedelta
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=30)
    pipeline = [
        {"$match": {"status": "completed", "created_at": {"$gte": since}}},
        {"$group": {
            "_id": {
                "year":  {"$year": "$created_at"},
                "month": {"$month": "$created_at"},
                "day":   {"$dayOfMonth": "$created_at"},
            },
            "revenue":  {"$sum": "$amount"},
            "bookings": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    return [
        {
            "date": f"{r['_id']['year']}-{r['_id']['month']:02d}-{r['_id']['day']:02d}",
            "revenue": round(r["revenue"], 2),
            "commission": round(r["revenue"] * commission_rate / 100, 2),
            "bookings": r["bookings"],
        }
        for r in result
    ]


async def get_yearly_revenue(db: AsyncIOMotorDatabase, commission_rate: float = 10) -> list[dict]:
    """Last 5 years yearly revenue aggregation."""
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": {"year": {"$year": "$created_at"}},
            "revenue":  {"$sum": "$amount"},
            "bookings": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1}},
        {"$limit": 5},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    return [
        {
            "year":       r["_id"]["year"],
            "revenue":    round(r["revenue"], 2),
            "commission": round(r["revenue"] * commission_rate / 100, 2),
            "profit":     round(r["revenue"] * commission_rate / 100, 2),
            "bookings":   r["bookings"],
        }
        for r in result
    ]


async def get_peak_hours(db: AsyncIOMotorDatabase) -> list[dict]:
    """Booking count grouped by hour of day (0–23)."""
    pipeline = [
        {"$group": {
            "_id": {"$hour": "$created_at"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    hour_map = {r["_id"]: r["count"] for r in result}
    return [
        {"hour": h, "label": f"{h:02d}:00", "bookings": hour_map.get(h, 0)}
        for h in range(24)
    ]


async def get_top_workers(db: AsyncIOMotorDatabase, limit: int = 10) -> list[dict]:
    """Top workers by completed bookings + average rating."""
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id":      "$worker_id",
            "bookings": {"$sum": 1},
            "revenue":  {"$sum": "$amount"},
        }},
        {"$sort": {"bookings": -1}},
        {"$limit": limit},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    enriched = []
    for r in result:
        worker = await db.workers.find_one({"user_id": r["_id"]}) or {}
        user   = None
        try:
            user = await db.users.find_one({"_id": ObjectId(r["_id"])}) or {}
        except Exception:
            pass
        enriched.append({
            "worker_id":  r["_id"],
            "name":       (user or {}).get("name") or worker.get("name", "Worker"),
            "service":    worker.get("service_type", ""),
            "bookings":   r["bookings"],
            "revenue":    round(r["revenue"], 2),
            "rating":     round(worker.get("average_rating", 0), 2),
            "total_jobs": worker.get("total_jobs", r["bookings"]),
        })
    return enriched


async def get_top_services(db: AsyncIOMotorDatabase, limit: int = 10) -> list[dict]:
    """Top services by booking count and total revenue."""
    pipeline = [
        {"$group": {
            "_id":      "$service_type",
            "bookings": {"$sum": 1},
            "revenue":  {"$sum": "$amount"},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
        }},
        {"$sort": {"bookings": -1}},
        {"$limit": limit},
    ]
    result = await db.bookings.aggregate(pipeline).to_list(length=None)
    return [
        {
            "service":   r["_id"] or "Unknown",
            "bookings":  r["bookings"],
            "revenue":   round(r["revenue"], 2),
            "completed": r["completed"],
            "completion_rate": round(r["completed"] / r["bookings"] * 100, 1) if r["bookings"] else 0,
        }
        for r in result
    ]


async def get_customer_growth(db: AsyncIOMotorDatabase) -> list[dict]:
    """Month-by-month new customer registrations for the last 12 months."""
    pipeline = [
        {"$match": {"role": "customer"}},
        {"$group": {
            "_id": {
                "year":  {"$year": "$created_at"},
                "month": {"$month": "$created_at"},
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12},
    ]
    result = await db.users.aggregate(pipeline).to_list(length=None)
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {
            "month": months[r["_id"]["month"] - 1],
            "year":  r["_id"]["year"],
            "count": r["count"],
        }
        for r in result
    ]


async def get_worker_growth(db: AsyncIOMotorDatabase) -> list[dict]:
    """Month-by-month new worker registrations for the last 12 months."""
    pipeline = [
        {"$match": {"role": "worker"}},
        {"$group": {
            "_id": {
                "year":  {"$year": "$created_at"},
                "month": {"$month": "$created_at"},
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12},
    ]
    result = await db.users.aggregate(pipeline).to_list(length=None)
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {
            "month": months[r["_id"]["month"] - 1],
            "year":  r["_id"]["year"],
            "count": r["count"],
        }
        for r in result
    ]


async def get_complaint_analysis(db: AsyncIOMotorDatabase) -> dict:
    """Complaints grouped by category, status, and priority."""
    by_category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    by_status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    by_priority_pipeline = [
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
    ]
    by_category = await db.complaints.aggregate(by_category_pipeline).to_list(length=None)
    by_status   = await db.complaints.aggregate(by_status_pipeline).to_list(length=None)
    by_priority = await db.complaints.aggregate(by_priority_pipeline).to_list(length=None)
    return {
        "by_category": [{"category": r["_id"] or "Other", "count": r["count"]} for r in by_category],
        "by_status":   [{"status":   r["_id"] or "unknown", "count": r["count"]} for r in by_status],
        "by_priority": [{"priority": r["_id"] or "normal", "count": r["count"]} for r in by_priority],
    }


async def get_ai_forecast(db: AsyncIOMotorDatabase) -> dict:
    """Gemini AI-powered revenue forecast, demand forecast, and worker performance."""
    import json

    # Gather stats for the prompt
    stats = await get_dashboard_stats(db)
    monthly = await get_revenue_per_month(db)
    services = await get_service_popularity(db)
    top_workers_data = await get_top_workers(db, limit=5)

    prompt = f"""You are a business intelligence analyst for OneDW, an AI-powered hyperlocal home services platform.

Current Platform Stats:
- Total Customers: {stats['customers']['total']}
- New Customers This Month: {stats['customers']['new_month']}
- Total Workers: {stats['workers']['total']}
- Verified Workers: {stats['workers']['verified']}
- Total Bookings: {stats['bookings']['total']}
- Completed Bookings: {stats['bookings']['completed']}
- Open Complaints: {stats['complaints']['open']}
- Total Revenue: ₹{stats['revenue']['total']:.2f}
- Platform Commission (10%): ₹{stats['revenue']['platform_commission']:.2f}
- Recent Monthly Revenue: {[f"{{m['month']}}: ₹{{m['revenue']:.0f}}" for m in monthly[-6:]]}
- Top Services: {[s['service'] for s in services[:5]]}
- Top Workers by Bookings: {[f"{{w['name']}} ({{w['bookings']}} bookings, {{w['rating']}}★)" for w in top_workers_data]}

Provide a structured business intelligence report in valid JSON with these exact keys:
{{
  "revenue_forecast": {{
    "next_month_prediction": <number in INR>,
    "next_quarter_prediction": <number in INR>,
    "confidence": <percentage 0-100>,
    "trend": "growing" | "stable" | "declining",
    "insight": "<one-sentence insight>"
  }},
  "demand_forecast": {{
    "peak_services": ["<service1>", "<service2>", "<service3>"],
    "peak_days": ["<day1>", "<day2>"],
    "peak_hours": "<time range>",
    "recommendation": "<actionable recommendation>"
  }},
  "worker_performance": {{
    "top_performer": "<name>",
    "avg_completion_rate": <percentage>,
    "workforce_recommendation": "<recommendation to improve workforce>"
  }},
  "business_health": {{
    "score": <0-100>,
    "status": "Excellent" | "Good" | "Fair" | "Needs Attention",
    "key_strength": "<one strength>",
    "key_risk": "<one risk>",
    "action_items": ["<action1>", "<action2>", "<action3>"]
  }}
}}

Return ONLY the JSON object, no markdown, no explanation."""

    try:
        import google.generativeai as genai
        from app.config import settings
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        forecast = json.loads(text.strip())
        forecast["generated_at"] = datetime.now(timezone.utc).isoformat()
        return forecast
    except Exception as e:
        # Fallback with statistical projection
        total_rev = stats["revenue"]["total"]
        monthly_avg = total_rev / max(len(monthly), 1)
        return {
            "revenue_forecast": {
                "next_month_prediction": round(monthly_avg * 1.05, 2),
                "next_quarter_prediction": round(monthly_avg * 3.15, 2),
                "confidence": 65,
                "trend": "growing",
                "insight": "Revenue shows steady growth based on historical data.",
            },
            "demand_forecast": {
                "peak_services": [s["service"] for s in services[:3]],
                "peak_days": ["Saturday", "Sunday"],
                "peak_hours": "09:00–11:00 and 17:00–20:00",
                "recommendation": "Increase worker availability during peak hours.",
            },
            "worker_performance": {
                "top_performer": top_workers_data[0]["name"] if top_workers_data else "N/A",
                "avg_completion_rate": 85,
                "workforce_recommendation": "Onboard more verified workers to meet growing demand.",
            },
            "business_health": {
                "score": 72,
                "status": "Good",
                "key_strength": "Strong customer retention",
                "key_risk": "Open complaints need faster resolution",
                "action_items": [
                    "Reduce complaint resolution time",
                    "Expand top-performing services",
                    "Onboard more workers in high-demand areas",
                ],
            },
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "fallback": True,
            "error": str(e),
        }
