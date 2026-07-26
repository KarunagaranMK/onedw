"""
Cost estimation service — provides estimated cost ranges for service issues.
Based on service type, issue category, severity, and historical data.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger("onedw.cost")

SERVICE_BASE_COSTS = {
    "Plumber": {"min": 300, "max": 2000, "avg": 800},
    "Electrician": {"min": 250, "max": 3000, "avg": 900},
    "Carpenter": {"min": 500, "max": 5000, "avg": 1500},
    "Painter": {"min": 400, "max": 8000, "avg": 2000},
    "Cleaning": {"min": 200, "max": 3000, "avg": 700},
    "AC Repair": {"min": 500, "max": 5000, "avg": 1500},
    "Appliance Repair": {"min": 400, "max": 4000, "avg": 1200},
    "Water Tank Cleaning": {"min": 500, "max": 3000, "avg": 1200},
    "Gardening": {"min": 300, "max": 2000, "avg": 800},
}

SEVERITY_MULTIPLIER = {
    "low": 0.7,
    "medium": 1.0,
    "high": 1.5,
    "emergency": 2.0,
}


async def estimate_cost(
    db: AsyncIOMotorDatabase,
    service_type: str,
    issue_category: str,
    severity: str = "medium",
    image_count: int = 0,
) -> dict:
    """Estimate cost range for a service issue."""
    base = SERVICE_BASE_COSTS.get(service_type, {"min": 300, "max": 3000, "avg": 1000})
    multiplier = SEVERITY_MULTIPLIER.get(severity, 1.0)

    min_cost = round(base["min"] * multiplier, 2)
    max_cost = round(base["max"] * multiplier, 2)
    avg_cost = round(base["avg"] * multiplier, 2)

    if image_count > 3:
        avg_cost = round(avg_cost * 1.1, 2)

    try:
        completed_bookings = await db.bookings.find({
            "service_type": service_type,
            "status": "completed",
        }).to_list(length=50)

        payments = []
        for booking in completed_bookings:
            payment = await db.payments.find_one({
                "booking_id": str(booking.get("_id", "")),
                "status": "completed",
            })
            if payment:
                payments.append(float(payment.get("amount", 0)))

        if payments:
            historical_avg = sum(payments) / len(payments)
            avg_cost = round((avg_cost + historical_avg) / 2, 2)
            min_cost = round(min(avg_cost * 0.7, min_cost), 2)
            max_cost = round(max(avg_cost * 1.5, max_cost), 2)
    except Exception as exc:
        logger.warning("Could not fetch historical data for cost estimation: %s", exc)

    notes = None
    if severity == "emergency":
        notes = "Emergency service may incur additional charges."
    elif severity == "high":
        notes = "Complex issue — final price may vary based on parts needed."

    return {
        "min_cost": min_cost,
        "max_cost": max_cost,
        "average_cost": avg_cost,
        "currency": "INR",
        "note": notes,
    }
