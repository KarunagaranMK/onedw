"""
OTP service — generate and verify 6-digit OTP for job start verification.
In production: send via SMS/WhatsApp. In dev: returns OTP in response.
"""
import random
import string
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from bson import ObjectId


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def generate_otp(db, booking_id: str, customer_id: str) -> dict:
    """Generate a fresh OTP for a booking and store it in DB."""
    # Validate booking belongs to this customer
    booking = await db.bookings.find_one({"_id": ObjectId(booking_id)}) if len(booking_id) == 24 else None
    if not booking:
        booking = await db.bookings.find_one({"_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != customer_id:
        raise HTTPException(status_code=403, detail="Not your booking.")
    if booking.get("status") != "accepted":
        raise HTTPException(
            status_code=400,
            detail=f"OTP can only be generated when booking is 'accepted'. Current: {booking.get('status')}",
        )

    otp = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    # Upsert OTP record
    await db.otp.update_one(
        {"booking_id": booking_id},
        {
            "$set": {
                "booking_id": booking_id,
                "otp": otp,
                "used": False,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )

    # In production, send OTP via SMS here. In dev, we return it.
    return {
        "success": True,
        "message": "OTP generated successfully. Share with worker to start job.",
        "otp": otp,  # Remove in production — send via SMS instead
    }


async def verify_otp(db, booking_id: str, otp_input: str, worker_id: str) -> dict:
    """Worker enters OTP to verify and start the job."""
    # Validate booking belongs to this worker
    booking = None
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        pass
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("worker_id") != worker_id:
        raise HTTPException(status_code=403, detail="Not your booking.")
    if booking.get("status") not in ("accepted", "worker_on_the_way"):
        raise HTTPException(
            status_code=400,
            detail=f"OTP verification not applicable for status: {booking.get('status')}",
        )

    otp_record = await db.otp.find_one({"booking_id": booking_id})
    if not otp_record:
        raise HTTPException(status_code=404, detail="OTP not generated yet. Ask customer to generate OTP.")

    if otp_record.get("used"):
        raise HTTPException(status_code=400, detail="OTP already used.")

    expires_at = otp_record.get("expires_at")
    if expires_at and datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Ask customer to generate a new one.")

    if otp_record.get("otp") != otp_input.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP. Please try again.")

    # Mark OTP as used
    await db.otp.update_one(
        {"booking_id": booking_id},
        {"$set": {"used": True, "verified_at": datetime.now(timezone.utc)}},
    )

    # Advance booking to 'started'
    await db.bookings.update_one(
        {"_id": booking.get("_id")},
        {"$set": {"status": "started", "started_at": datetime.now(timezone.utc)}},
    )

    # Create notification for customer
    try:
        await _notify(db, booking.get("customer_id"), "Job Started! 🔧",
                      "Your worker has verified the OTP and started the job.", "success", booking_id)
    except Exception:
        pass

    return {"success": True, "message": "OTP verified! Job has started."}


async def _notify(db, user_id: str, title: str, body: str, ntype: str = "info", booking_id: str = None):
    """Internal helper to create a notification."""
    from datetime import datetime, timezone
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
