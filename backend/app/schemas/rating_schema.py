"""
Pydantic schemas for ratings submitted by customers after service completion.
"""
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime


class RatingCreateSchema(BaseModel):
    booking_id: str = Field(..., description="ID of the completed booking")
    worker_id: str = Field(..., description="ID of the worker being rated")
    stars: int = Field(5, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = Field(None, max_length=500)

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
    created_at: datetime
