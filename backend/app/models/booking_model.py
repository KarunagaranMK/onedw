"""
MongoDB document shape for the 'bookings' collection.
Extended with issue details, media, AI analysis, warranty, before/after photos.
"""
from datetime import datetime, timezone


def build_booking_document(
    request_id: str,
    customer_id: str,
    worker_id: str,
    service_type: str,
    location: str,
    preferred_date: str,
    preferred_time: str,
    issue_details: dict = None,
) -> dict:
    """Construct a new booking document ready for insertion."""
    now = datetime.now(timezone.utc)
    doc = {
        "request_id": request_id,
        "customer_id": customer_id,
        "worker_id": worker_id,
        "service_type": service_type,
        "location": location,
        "preferred_date": preferred_date,
        "preferred_time": preferred_time,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    if issue_details:
        doc["issue_details"] = issue_details
    return doc
