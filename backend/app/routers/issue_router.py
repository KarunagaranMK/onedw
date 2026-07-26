"""
Issue Reporting Router — media upload, AI analysis, voice transcription,
warranty, counter-offers, issue history, and live tracking endpoints.
"""
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.issue_schema import (
    IssueDetailsSchema, IssueDetailsUpdateSchema,
    VoiceTranscriptionRequest, VoiceTranscriptionResponse,
    ImageAnalysisRequest, ImageAnalysisResponse,
    CostEstimationRequest, CostEstimationResponse,
    BeforeAfterImagesSchema,
    WarrantyCreateSchema, WarrantyResponseSchema, WarrantyClaimSchema,
    CounterOfferSchema, CounterOfferResponseSchema,
    IssueHistoryEntrySchema,
    LiveTrackingSchema,
)
from app.services import media_service, ai_analysis_service, voice_service, cost_service
from app.services import warranty_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/issues", tags=["Issue Reporting"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


# ─── Media Upload ──────────────────────────────────────────────────────────────

@router.post("/upload-media")
async def upload_media(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload an image, video, or voice recording for issue reporting."""
    return await media_service.upload_media(file)


@router.get("/media/files/{file_path:path}")
async def serve_media_file(file_path: str):
    """Serve locally uploaded media files."""
    full_path = (UPLOAD_DIR / file_path).resolve()
    if not str(full_path).startswith(str(UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path.")
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(str(full_path))


# ─── AI Image Analysis ────────────────────────────────────────────────────────

@router.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(
    payload: ImageAnalysisRequest,
    current_user: dict = Depends(get_current_user),
):
    """Analyze an uploaded issue image using AI to detect possible problems."""
    result = await ai_analysis_service.analyze_image(payload.image_url, payload.service_type)
    return ImageAnalysisResponse(**{k: v for k, v in result.items() if k in ImageAnalysisResponse.model_fields})


# ─── Voice Transcription ──────────────────────────────────────────────────────

@router.post("/voice-transcription", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(
    payload: VoiceTranscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Transcribe a voice recording to text."""
    result = await voice_service.transcribe_voice(payload.audio_url)
    return VoiceTranscriptionResponse(**result)


# ─── Cost Estimation ──────────────────────────────────────────────────────────

@router.post("/estimate-cost", response_model=CostEstimationResponse)
async def estimate_cost(
    payload: CostEstimationRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Estimate cost range for a service issue."""
    return await cost_service.estimate_cost(
        db, payload.service_type, payload.issue_category,
        payload.severity.value if hasattr(payload.severity, 'value') else payload.severity,
        payload.image_count,
    )


# ─── Issue Details on Booking ─────────────────────────────────────────────────

@router.put("/booking/{booking_id}/issue")
async def update_booking_issue(
    booking_id: str,
    payload: IssueDetailsSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Add or update issue details on a booking."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your booking.")

    issue_data = payload.model_dump(mode="json")
    issue_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.bookings.update_one(
        {"_id": oid},
        {"$set": {"issue_details": issue_data, "updated_at": datetime.now(timezone.utc)}},
    )

    updated = await db.bookings.find_one({"_id": oid})
    return {"success": True, "issue_details": updated.get("issue_details", {})}


@router.get("/booking/{booking_id}/issue")
async def get_booking_issue(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get issue details for a booking."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != current_user["_id"] and booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    return booking.get("issue_details", {})


# ─── Before/After Photos ──────────────────────────────────────────────────────

@router.post("/booking/{booking_id}/before-images")
async def upload_before_images(
    booking_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker uploads before-work images."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the assigned worker can upload.")

    media = await media_service.upload_media(file)
    media["uploaded_by"] = "worker"
    media["uploaded_at"] = datetime.now(timezone.utc).isoformat()

    await db.bookings.update_one(
        {"_id": oid},
        {"$push": {"before_images": media}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    return media


@router.post("/booking/{booking_id}/after-images")
async def upload_after_images(
    booking_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker uploads after-work images."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the assigned worker can upload.")

    media = await media_service.upload_media(file)
    media["uploaded_by"] = "worker"
    media["uploaded_at"] = datetime.now(timezone.utc).isoformat()

    await db.bookings.update_one(
        {"_id": oid},
        {"$push": {"after_images": media}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    return media


@router.get("/booking/{booking_id}/images")
async def get_booking_images(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get before and after images for a booking."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != current_user["_id"] and booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    return {
        "before_images": booking.get("before_images", []),
        "after_images": booking.get("after_images", []),
    }


# ─── Warranty ──────────────────────────────────────────────────────────────────

@router.post("/warranty/create", response_model=WarrantyResponseSchema, status_code=201)
async def create_warranty(
    payload: WarrantyCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Create a warranty for a completed booking."""
    return await warranty_service.create_warranty(db, payload, current_user["_id"])


@router.get("/warranty/booking/{booking_id}")
async def get_booking_warranty(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get warranty for a booking."""
    warranty = await warranty_service.get_booking_warranty(db, booking_id)
    return warranty or {"status": "none"}


@router.get("/warranty/my-warranties")
async def get_my_warranties(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get all warranties for the current customer."""
    return await warranty_service.get_customer_warranties(db, current_user["_id"])


@router.post("/warranty/{warranty_id}/claim")
async def claim_warranty(
    warranty_id: str,
    payload: WarrantyClaimSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """File a warranty claim."""
    return await warranty_service.claim_warranty(
        db, warranty_id, current_user["_id"], payload.description, payload.issue_images
    )


# ─── Counter Offer ─────────────────────────────────────────────────────────────

@router.post("/counter-offer")
async def send_counter_offer(
    payload: CounterOfferSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker sends a counter offer with estimated price."""
    try:
        oid = ObjectId(payload.booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the assigned worker can send counter offers.")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": ObjectId(),
        "booking_id": payload.booking_id,
        "worker_id": current_user["_id"],
        "customer_id": booking.get("customer_id", ""),
        "estimated_price": payload.estimated_price,
        "message": payload.message or "",
        "estimated_duration": payload.estimated_duration or "",
        "status": "pending",
        "created_at": now,
    }
    await db.counter_offers.insert_one(doc)

    await db.bookings.update_one(
        {"_id": oid},
        {"$set": {
            "worker_quote": {
                "price": payload.estimated_price,
                "message": payload.message,
                "duration": payload.estimated_duration,
                "created_at": now.isoformat(),
            },
            "updated_at": now,
        }},
    )

    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, booking.get("customer_id"),
            "New Quote Received 💰",
            f"Worker sent a quote of ₹{payload.estimated_price} for your {booking.get('service_type', 'service')}.",
            "info", payload.booking_id,
        )
    except Exception:
        pass

    return {
        "id": str(doc["_id"]),
        "estimated_price": payload.estimated_price,
        "message": payload.message,
        "status": "pending",
    }


@router.post("/counter-offer/{offer_id}/accept")
async def accept_counter_offer(
    offer_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Customer accepts a counter offer."""
    try:
        oid = ObjectId(offer_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid offer ID.")

    offer = await db.counter_offers.find_one({"_id": oid})
    if not offer:
        raise HTTPException(status_code=404, detail="Counter offer not found.")
    if offer.get("customer_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not your offer.")

    await db.counter_offers.update_one(
        {"_id": oid}, {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc)}}
    )

    await db.bookings.update_one(
        {"_id": ObjectId(offer["booking_id"])},
        {"$set": {
            "amount": offer["estimated_price"],
            "worker_quote.status": "accepted",
            "updated_at": datetime.now(timezone.utc),
        }},
    )

    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, offer.get("worker_id"),
            "Quote Accepted! ✅",
            f"Customer accepted your quote of ₹{offer['estimated_price']}.",
            "success", offer.get("booking_id"),
        )
    except Exception:
        pass

    return {"success": True, "message": "Counter offer accepted."}


# ─── Issue History ─────────────────────────────────────────────────────────────

@router.get("/history/{address_id}")
async def get_issue_history(
    address_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get issue history for an address/location."""
    cursor = db.bookings.find({
        "customer_id": current_user["_id"],
        "location": {"$regex": address_id, "$options": "i"},
    }).sort("created_at", -1)
    bookings = await cursor.to_list(length=50)

    history = []
    for b in bookings:
        issue = b.get("issue_details", {})
        worker_user = None
        try:
            worker_user = await db.users.find_one({"_id": ObjectId(b.get("worker_id", ""))})
        except Exception:
            pass

        rating = await db.ratings.find_one({"booking_id": str(b.get("_id", ""))})

        history.append({
            "booking_id": str(b.get("_id", "")),
            "service_type": b.get("service_type", ""),
            "issue_title": issue.get("issue_title", b.get("service_type", "")),
            "issue_description": issue.get("issue_description", b.get("description", "")),
            "severity": issue.get("severity", "medium"),
            "worker_name": (worker_user or {}).get("name", "Professional"),
            "worker_rating": (rating or {}).get("stars", None),
            "cost": b.get("amount"),
            "images": [img.get("url", "") for img in issue.get("issue_images", [])],
            "created_at": b.get("created_at", datetime.now(timezone.utc)),
        })

    return history


# ─── Live Tracking ─────────────────────────────────────────────────────────────

@router.post("/booking/{booking_id}/tracking")
async def update_tracking(
    booking_id: str,
    payload: LiveTrackingSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker updates live tracking location."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Only the assigned worker can update tracking.")

    tracking_data = {
        "worker_lat": payload.worker_lat,
        "worker_lon": payload.worker_lon,
        "eta_minutes": payload.eta_minutes,
        "distance_km": payload.distance_km,
        "updated_at": datetime.now(timezone.utc),
    }

    await db.bookings.update_one(
        {"_id": oid},
        {"$set": {"live_tracking": tracking_data, "updated_at": datetime.now(timezone.utc)}},
    )

    return {"success": True, "tracking": tracking_data}


@router.get("/booking/{booking_id}/tracking")
async def get_tracking(
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get live tracking for a booking."""
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid booking ID.")

    booking = await db.bookings.find_one({"_id": oid})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking.get("customer_id") != current_user["_id"] and booking.get("worker_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    return booking.get("live_tracking", {})
