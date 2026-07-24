"""
OTP, Notifications, and Payment schemas for OneDW.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── OTP ──────────────────────────────────────────────────────────────────────

class OTPGenerateRequest(BaseModel):
    booking_id: str

class OTPVerifyRequest(BaseModel):
    booking_id: str
    otp: str

class OTPResponse(BaseModel):
    success: bool
    message: str
    otp: Optional[str] = None   # returned in dev mode only


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    body: str
    type: str = "info"          # info | success | warning | error
    read: bool = False
    booking_id: Optional[str] = None
    created_at: Optional[datetime] = None


class NotificationMarkRead(BaseModel):
    notification_id: str


# ─── Payments ─────────────────────────────────────────────────────────────────

class PaymentCreateSchema(BaseModel):
    booking_id: str
    amount: float
    method: str = "cash"        # cash | upi | card | wallet
    notes: Optional[str] = None

class PaymentResponseSchema(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    worker_id: str
    amount: float
    method: str
    status: str                 # pending | completed | failed | refunded
    transaction_id: Optional[str] = None
    created_at: Optional[datetime] = None

class InvoiceResponseSchema(BaseModel):
    invoice_number: str
    booking_id: str
    customer_name: str
    worker_name: str
    service_type: str
    service_date: str
    items: List[dict]
    subtotal: float
    platform_fee: float
    total: float
    payment_method: str
    payment_status: str
    created_at: Optional[datetime] = None
