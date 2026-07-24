"""
OTP, Notification, and Payment endpoints for OneDW.
All named routes placed before any /{id} catch-all routes.
"""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.otp_payment_schema import (
    OTPGenerateRequest, OTPVerifyRequest, OTPResponse,
    NotificationResponse, NotificationMarkRead,
    PaymentCreateSchema, PaymentResponseSchema, InvoiceResponseSchema,
)
from app.services import otp_service, notification_service, payment_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

# ── OTP Router ──────────────────────────────────────────────────────────────
otp_router = APIRouter(prefix="/api/otp", tags=["OTP"])

@otp_router.post("/generate", response_model=OTPResponse)
async def generate_otp(
    payload: OTPGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Customer generates OTP for a booking to hand to the worker."""
    return await otp_service.generate_otp(db, payload.booking_id, current_user["_id"])


@otp_router.post("/verify", response_model=OTPResponse)
async def verify_otp(
    payload: OTPVerifyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker verifies OTP to start the job."""
    return await otp_service.verify_otp(db, payload.booking_id, payload.otp, current_user["_id"])


# ── Notification Router ───────────────────────────────────────────────────────
notif_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@notif_router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get all notifications for the logged-in user."""
    return await notification_service.get_my_notifications(db, current_user["_id"])


@notif_router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get unread notification count."""
    count = await notification_service.get_unread_count(db, current_user["_id"])
    return {"unread_count": count}


@notif_router.put("/mark-all-read")
async def mark_all_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Mark all notifications as read."""
    return await notification_service.mark_all_read(db, current_user["_id"])


@notif_router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Mark a single notification as read."""
    return await notification_service.mark_read(db, notification_id, current_user["_id"])


# ── Payment Router ────────────────────────────────────────────────────────────
payment_router = APIRouter(prefix="/api/payments", tags=["Payments"])

@payment_router.post("", response_model=PaymentResponseSchema)
async def create_payment(
    payload: PaymentCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Record payment for a completed booking."""
    return await payment_service.create_payment(db, payload, current_user["_id"])


@payment_router.get("/invoice/{booking_id}", response_model=InvoiceResponseSchema)
async def get_invoice(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get invoice for a booking."""
    return await payment_service.generate_invoice(db, booking_id, current_user["_id"])


@payment_router.get("/earnings")
async def get_worker_earnings(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get worker earnings summary."""
    return await payment_service.get_worker_earnings(db, current_user["_id"])


@payment_router.get("/booking/{booking_id}")
async def get_payment_for_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get payment record for a booking."""
    result = await payment_service.get_booking_payment(db, booking_id, current_user["_id"])
    return result or {"status": "unpaid"}
