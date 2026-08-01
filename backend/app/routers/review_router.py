"""
Review endpoints — customers submit reviews, admin moderates them.
"""
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.review_schema import (
    ReviewCreateSchema, AdminReplySchema,
    ReviewResponseSchema, WorkerReviewCreateSchema,
)
from app.services import review_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponseSchema, status_code=status.HTTP_201_CREATED)
async def submit_review(
    payload: ReviewCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Customer submits a review after a completed booking."""
    return await review_service.create_customer_review(db, payload, current_user["_id"])


@router.get("/my", response_model=list[ReviewResponseSchema])
async def my_reviews(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List all reviews submitted by the logged-in customer."""
    return await review_service.get_my_reviews(db, current_user["_id"])


# ── IMPORTANT: /public and /worker must come BEFORE /{review_id} ─────────────

@router.get("/public", response_model=list[ReviewResponseSchema])
async def public_reviews(
    service: str = Query(None),
    min_rating: int = Query(None),
    skip: int = Query(0),
    limit: int = Query(20),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Public: paginated reviews for the public reviews page. No auth required."""
    return await review_service.get_public_reviews(
        db, service=service, min_rating=min_rating, skip=skip, limit=limit
    )


@router.post("/worker", status_code=status.HTTP_201_CREATED)
async def submit_worker_review(
    payload: WorkerReviewCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker submits a review of a customer after a completed booking."""
    if current_user.get("role") != "worker":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only workers can use this endpoint.")
    return await review_service.create_worker_review(db, payload, current_user["_id"])


@router.get("", response_model=list[ReviewResponseSchema])
async def list_reviews(
    worker_id: str = Query(None),
    min_rating: int = Query(None),
    include_hidden: bool = Query(False),
    skip: int = Query(0),
    limit: int = Query(20),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Public: list reviews, filtered by worker and minimum rating."""
    return await review_service.get_reviews(
        db,
        worker_id=worker_id,
        min_rating=min_rating,
        include_hidden=include_hidden,
        skip=skip,
        limit=limit,
    )


# ── Parameterized routes (must come AFTER literal segment routes) ─────────────

@router.get("/{review_id}", response_model=ReviewResponseSchema)
async def get_review(
    review_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await review_service.get_review_by_id(db, review_id)


@router.put("/{review_id}/hide")
async def hide_review(
    review_id: str,
    hide: bool = True,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: hide or unhide an abusive review."""
    if current_user.get("role") != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required.")
    return await review_service.admin_hide_review(db, review_id, hide)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: permanently delete a fake review."""
    if current_user.get("role") != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required.")
    await review_service.admin_delete_review(db, review_id)


@router.post("/{review_id}/reply", response_model=ReviewResponseSchema)
async def admin_reply(
    review_id: str,
    payload: AdminReplySchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: post an official OneDW Team verified reply."""
    if current_user.get("role") != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required.")
    return await review_service.admin_reply_to_review(db, review_id, payload)
