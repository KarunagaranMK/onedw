"""
Pydantic schemas for ratings submitted by customers after service completion.
Extended with category ratings and media uploads.
"""
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime


class ReviewMediaSchema(BaseModel):
    url: str = ""
    media_type: str = "image"
    filename: Optional[str] = None
    size: Optional[int] = None


class RatingCreateSchema(BaseModel):
    booking_id: str = Field(..., description="ID of the completed booking")
    worker_id: str = Field(..., description="ID of the worker being rated")
    stars: int = Field(5, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = Field(None, max_length=1000)
    punctuality: Optional[int] = Field(None, ge=1, le=5)
    behavior: Optional[int] = Field(None, ge=1, le=5)
    work_quality: Optional[int] = Field(None, ge=1, le=5)
    communication: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    cleanliness: Optional[int] = Field(None, ge=1, le=5)
    recommend: bool = True
    review_images: List[ReviewMediaSchema] = []
    review_videos: List[ReviewMediaSchema] = []

    @model_validator(mode="before")
    @classmethod
    def normalise_fields(cls, values):
        if isinstance(values, dict):
            if "rating" in values and values["rating"] is not None and "stars" not in values:
                values["stars"] = values["rating"]
            if "review" in values and values["review"] is not None and "comment" not in values:
                values["comment"] = values["review"]
        return values


class RatingResponseSchema(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    worker_id: str
    stars: int
    comment: Optional[str] = None
    review: Optional[str] = None
    punctuality: Optional[int] = None
    behavior: Optional[int] = None
    work_quality: Optional[int] = None
    communication: Optional[int] = None
    value_for_money: Optional[int] = None
    cleanliness: Optional[int] = None
    recommend: bool = True
    review_images: List[dict] = []
    review_videos: List[dict] = []
    created_at: datetime
