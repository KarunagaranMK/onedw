"""
Payment service — create payment records, generate invoices.
Platform fee: 10% of job cost.
"""
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from bson import ObjectId

from app.schemas.otp_payment_schema import PaymentCreateSchema

PLATFORM_FEE_RATE = 0.10  # 10%


async def create_payment(db, payload: PaymentCreateSchema, customer_id: str) -> dict:
    """Record a payment for a completed booking."""
    # Validate booking
    booking = None
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(payload.booking_id)})
    except Exception:
        pass
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Not your booking.")
    if booking.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Payment can only be made for completed bookings.")

    # Check if already paid
    existing = await db.payments.find_one({"booking_id": payload.booking_id, "status": "completed"})
    if existing:
        raise HTTPException(status_code=400, detail="This booking is already paid.")

    transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    now = datetime.now(timezone.utc)

    doc = {
        "_id": ObjectId(),
        "booking_id": payload.booking_id,
        "customer_id": customer_id,
        "worker_id": booking.get("worker_id", ""),
        "amount": payload.amount,
        "method": payload.method,
        "status": "completed",
        "transaction_id": transaction_id,
        "notes": payload.notes or "",
        "created_at": now,
    }
    await db.payments.insert_one(doc)

    # Mark booking as paid
    await db.bookings.update_one(
        {"_id": booking["_id"]},
        {"$set": {"payment_status": "paid", "payment_method": payload.method}},
    )

    # Notify worker
    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, booking.get("worker_id"),
            "Payment Received 💰",
            f"₹{payload.amount} received via {payload.method} for your completed job.",
            "success", payload.booking_id,
        )
    except Exception:
        pass

    return _serialize_payment(doc)


async def get_booking_payment(db, booking_id: str, user_id: str) -> dict:
    """Get payment info for a booking."""
    payment = await db.payments.find_one({"booking_id": booking_id})
    return _serialize_payment(payment) if payment else None


async def generate_invoice(db, booking_id: str, user_id: str) -> dict:
    """Generate a detailed invoice for a booking."""
    booking = None
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        pass
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != user_id and booking.get("worker_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Fetch user details
    customer = await db.users.find_one({"_id": ObjectId(booking["customer_id"])}) if booking.get("customer_id") else {}
    worker_user = await db.users.find_one({"_id": ObjectId(booking["worker_id"])}) if booking.get("worker_id") else {}
    worker_profile = await db.workers.find_one({"user_id": booking.get("worker_id")}) if booking.get("worker_id") else {}

    # Get payment
    payment = await db.payments.find_one({"booking_id": booking_id})

    hourly_rate = (worker_profile or {}).get("hourly_rate", 0)
    visit_charge = (worker_profile or {}).get("visit_charge", 0) or 50
    subtotal = float(booking.get("amount", hourly_rate + visit_charge or 500))
    platform_fee = round(subtotal * PLATFORM_FEE_RATE, 2)
    total = subtotal + platform_fee

    invoice_number = f"INV-{booking_id[:8].upper()}"

    preferred_date = booking.get("preferred_date", "")
    if hasattr(preferred_date, "strftime"):
        preferred_date = preferred_date.strftime("%Y-%m-%d")

    return {
        "invoice_number": invoice_number,
        "booking_id": booking_id,
        "customer_name": (customer or {}).get("name", "Customer"),
        "worker_name": (worker_user or {}).get("name", "Professional"),
        "service_type": booking.get("service_type", "Home Service"),
        "service_date": str(preferred_date),
        "items": [
            {"description": "Service Charge", "amount": subtotal - visit_charge},
            {"description": "Visit Charge", "amount": visit_charge},
        ],
        "subtotal": subtotal,
        "platform_fee": platform_fee,
        "total": total,
        "payment_method": (payment or {}).get("method", "pending"),
        "payment_status": (payment or {}).get("status", "unpaid"),
        "created_at": datetime.now(timezone.utc),
    }


async def get_worker_earnings(db, worker_id: str) -> dict:
    """Get worker earnings summary."""
    payments = await db.payments.find({"worker_id": worker_id, "status": "completed"}).to_list(length=None)
    total = sum(float(p.get("amount", 0)) for p in payments)
    platform_fee = round(total * PLATFORM_FEE_RATE, 2)
    net = round(total - platform_fee, 2)
    return {
        "total_earned": total,
        "platform_fee": platform_fee,
        "net_earnings": net,
        "completed_payments": len(payments),
    }


def _serialize_payment(doc: dict) -> dict:
    if not doc:
        return {}
    return {
        "id": str(doc.get("_id", "")),
        "booking_id": doc.get("booking_id", ""),
        "customer_id": doc.get("customer_id", ""),
        "worker_id": doc.get("worker_id", ""),
        "amount": doc.get("amount", 0),
        "method": doc.get("method", "cash"),
        "status": doc.get("status", "pending"),
        "transaction_id": doc.get("transaction_id"),
        "created_at": doc.get("created_at"),
    }
