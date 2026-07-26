"""
Complaint endpoints — customers & workers file complaints, admin manages them.
"""
from fastapi import APIRouter, Depends, Query, status, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.complaint_schema import (
    ComplaintCreateSchema, ComplaintMessageSchema,
    ComplaintStatusUpdateSchema, ComplaintResponseSchema,
    ComplaintMessageResponseSchema,
)
from app.services import complaint_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


@router.post("", response_model=ComplaintResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    payload: ComplaintCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Submit a new complaint (customer or worker)."""
    return await complaint_service.create_complaint(db, payload, current_user["_id"])


@router.get("/my", response_model=list[ComplaintResponseSchema])
async def my_complaints(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List all complaints filed by the current user."""
    return await complaint_service.get_my_complaints(db, current_user["_id"])


@router.get("", response_model=list[ComplaintResponseSchema])
async def all_complaints(
    status_filter: str = Query(None),
    priority_filter: str = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: list all complaints with optional filters."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return await complaint_service.get_all_complaints(
        db, status_filter=status_filter, priority_filter=priority_filter,
        skip=skip, limit=limit,
    )


@router.get("/{complaint_id}", response_model=ComplaintResponseSchema)
async def get_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get a single complaint. Non-admins can only view their own."""
    role = current_user.get("role")
    requester = None if role == "admin" else current_user["_id"]
    return await complaint_service.get_complaint_by_id(db, complaint_id, requester)


@router.put("/{complaint_id}/status", response_model=ComplaintResponseSchema)
async def update_status(
    complaint_id: str,
    payload: ComplaintStatusUpdateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: update complaint status and assign it."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return await complaint_service.update_complaint_status(db, complaint_id, payload)


@router.post("/{complaint_id}/messages", response_model=ComplaintMessageResponseSchema, status_code=status.HTTP_201_CREATED)
async def add_message(
    complaint_id: str,
    payload: ComplaintMessageSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Add a message to the complaint thread (admin or complainant)."""
    return await complaint_service.add_complaint_message(
        db, complaint_id, payload, current_user["_id"]
    )


@router.get("/{complaint_id}/messages", response_model=list[ComplaintMessageResponseSchema])
async def get_messages(
    complaint_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get all messages in a complaint thread."""
    return await complaint_service.get_complaint_messages(db, complaint_id)
