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
    settings_doc = await db.platform_settings.find_one({"key": "commission_rate"})
    commission_rate = settings_doc["value"] if settings_doc else 10
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


async def process_refund(
    db: AsyncIOMotorDatabase,
    booking_id: str,
    amount: float,
    refund_type: str,  # "full" | "partial" | "rejected"
    reason: str,
    admin_id: str,
) -> dict:
    """Record a refund decision for a completed/cancelled booking."""
    from datetime import datetime, timezone
    doc = {
        "booking_id": booking_id,
        "amount": amount,
        "refund_type": refund_type,
        "reason": reason,
        "processed_by": admin_id,
        "status": "approved" if refund_type != "rejected" else "rejected",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.refunds.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


# ─────────────────────────────────────────────────────────────────────────────
# Platform Settings
# ─────────────────────────────────────────────────────────────────────────────

_DEFAULT_SETTINGS = {
    "commission_rate": 10,
    "gst_rate": 18,
    "cancellation_charges": 50,
    "emergency_charges": 100,
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
        raise HTTPException(status_code=400, detail=f"Unknown setting key: {key}. Allowed: {sorted(allowed_keys)}")
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
    return _serialize(warning_doc)


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
# Platform Settings
# ─────────────────────────────────────────────────────────────────────────────

async def get_platform_settings(db: AsyncIOMotorDatabase) -> dict:
    cursor = db.platform_settings.find({})
    docs = await cursor.to_list(length=None)
    return {d["key"]: d["value"] for d in docs}


async def update_platform_setting(db: AsyncIOMotorDatabase, key: str, value) -> dict:
    await db.platform_settings.update_one(
        {"key": key},
        {"$set": {"key": key, "value": value, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"key": key, "value": value}
