"""
Pydantic schemas for the customer review system.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReviewCreateSchema(BaseModel):
    booking_id: str
    worker_id: str
    overall_rating: int = Field(..., ge=1, le=5)
    work_quality: int = Field(..., ge=1, le=5)
    professionalism: int = Field(..., ge=1, le=5)
    communication: int = Field(..., ge=1, le=5)
    punctuality: int = Field(..., ge=1, le=5)
    value_for_money: int = Field(..., ge=1, le=5)
    cleanliness: int = Field(..., ge=1, le=5)
    would_recommend: bool = True
    review_text: str = Field("", max_length=2000)
    review_images: List[str] = []   # Cloudinary URLs
    review_video: Optional[str] = None


class WorkerReviewCreateSchema(BaseModel):
    booking_id: str
    customer_id: str
    communication: int = Field(..., ge=1, le=5)
    cooperation: int = Field(..., ge=1, le=5)
    payment_experience: int = Field(..., ge=1, le=5)
    safety: int = Field(..., ge=1, le=5)
    overall_experience: int = Field(..., ge=1, le=5)
    positive_feedback: str = Field("", max_length=1000)
    suggestions: str = Field("", max_length=1000)
    report_misbehavior: bool = False
    misbehavior_note: str = Field("", max_length=1000)


class AdminReplySchema(BaseModel):
    reply_text: str = Field(..., min_length=1, max_length=2000)


class ReviewResponseSchema(BaseModel):
    id: str
    booking_id: str
    worker_id: str
    customer_id: str
    customer_name: Optional[str] = ""
    service_name: Optional[str] = ""
    overall_rating: int
    work_quality: Optional[int] = 5
    professionalism: Optional[int] = 5
    communication: Optional[int] = 5
    punctuality: Optional[int] = 5
    value_for_money: Optional[int] = 5
    cleanliness: Optional[int] = 5
    would_recommend: Optional[bool] = True
    review_text: Optional[str] = ""
    review_images: Optional[List[str]] = []
    review_video: Optional[str] = None
    is_hidden: Optional[bool] = False
    is_verified: Optional[bool] = True
    admin_reply: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
