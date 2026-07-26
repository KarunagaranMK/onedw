"""
Admin-only endpoints for dashboard stats, analytics, and management actions.
All routes require JWT + role == 'admin'.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional

from app.services import admin_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_dashboard_stats(db)


@router.get("/analytics/bookings-per-month")
async def bookings_per_month(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_bookings_per_month(db)


@router.get("/analytics/revenue-per-month")
async def revenue_per_month(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    settings = await admin_service.get_platform_settings(db)
    rate = float(settings.get("commission_rate", 10))
    return await admin_service.get_revenue_per_month(db, commission_rate=rate)


@router.get("/analytics/revenue-growth")
async def revenue_growth(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    settings = await admin_service.get_platform_settings(db)
    rate = float(settings.get("commission_rate", 10))
    return await admin_service.get_revenue_growth(db, commission_rate=rate)


@router.get("/analytics/service-popularity")
async def service_popularity(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_service_popularity(db)


# ── Customer Management ───────────────────────────────────────────────────────

@router.get("/customers")
async def list_customers(
    search: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_customers(db, search=search, skip=skip, limit=limit)


@router.put("/customers/{customer_id}/block")
async def block_customer(
    customer_id: str,
    block: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.block_customer(db, customer_id, block)


# ── Worker Management ─────────────────────────────────────────────────────────

@router.get("/workers")
async def list_workers(
    verification_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_workers(
        db, verification_status=verification_status,
        search=search, skip=skip, limit=limit,
    )


@router.put("/workers/{worker_id}/approve")
async def approve_worker(
    worker_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.update_worker_verification(db, worker_id, "approved")


@router.put("/workers/{worker_id}/reject")
async def reject_worker(
    worker_id: str,
    note: str = Query(""),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.update_worker_verification(db, worker_id, "rejected", note)


@router.put("/workers/{worker_id}/suspend")
async def suspend_worker(
    worker_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.update_worker_verification(db, worker_id, "suspended")


# ── Booking Management ────────────────────────────────────────────────────────

@router.get("/bookings")
async def list_bookings(
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_all_bookings(
        db, status_filter=status_filter, search=search, skip=skip, limit=limit,
    )


# ── Reviews Management ────────────────────────────────────────────────────────

@router.get("/reviews")
async def list_all_reviews(
    include_hidden: bool = Query(True),
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    from app.services import review_service
    _require_admin(current_user)
    return await review_service.get_reviews(
        db, include_hidden=include_hidden, skip=skip, limit=limit
    )


# ── Complaints Management ─────────────────────────────────────────────────────

@router.get("/complaints")
async def list_all_complaints(
    status_filter: Optional[str] = Query(None),
    priority_filter: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    from app.services import complaint_service
    _require_admin(current_user)
    return await complaint_service.get_all_complaints(
        db, status_filter=status_filter, priority_filter=priority_filter,
        skip=skip, limit=limit,
    )


# ── Warnings ──────────────────────────────────────────────────────────────────

class WarningPayload(BaseModel):
    target_id: str
    target_type: str  # "worker" | "customer"
    reason: str


@router.post("/warnings")
async def issue_warning(
    payload: WarningPayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.issue_warning(
        db, payload.target_id, payload.target_type,
        payload.reason, current_user["_id"],
    )


# ── Platform Settings ─────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.get_platform_settings(db)


class SettingUpdatePayload(BaseModel):
    key: str
    value: object


@router.put("/settings")
async def update_setting(
    payload: SettingUpdatePayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    return await admin_service.update_platform_setting(db, payload.key, payload.value)


# ── System Health ─────────────────────────────────────────────────────────────

@router.get("/system-health")
async def system_health(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    _require_admin(current_user)
    from app.database.connection import check_db_health
    db_ok = await check_db_health()
    return {"status": "healthy" if db_ok else "degraded", "database": db_ok}


class RefundPayload(BaseModel):
    booking_id: str
    amount: float
    refund_type: str   # "full" | "partial" | "rejected"
    reason: str


@router.post("/refund")
async def process_refund(
    payload: RefundPayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: record a refund decision for a booking."""
    _require_admin(current_user)
    return await admin_service.process_refund(
        db,
        booking_id=payload.booking_id,
        amount=payload.amount,
        refund_type=payload.refund_type,
        reason=payload.reason,
        admin_id=current_user["_id"],
    )


# ── Platform Settings ─────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: retrieve all platform settings."""
    _require_admin(current_user)
    return await admin_service.get_platform_settings(db)


class SettingUpdatePayload(BaseModel):
    value: float


@router.put("/settings/{key}")
async def update_setting(
    key: str,
    payload: SettingUpdatePayload,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: update a single platform setting by key."""
    _require_admin(current_user)
    return await admin_service.update_platform_setting(db, key, payload.value)
