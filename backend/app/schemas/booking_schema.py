"""
Pydantic schemas for bookings — creation, status updates, and API responses.
Extended with issue details for Smart Issue Reporting.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class IssueMediaField(BaseModel):
    url: str = ""
    media_type: str = "image"
    filename: Optional[str] = None
    size: Optional[int] = None
    thumbnail_url: Optional[str] = None
    uploaded_at: Optional[str] = None


class AIAnalysisField(BaseModel):
    possible_problems: List[str] = []
    estimated_difficulty: Optional[str] = None
    recommended_worker: Optional[str] = None
    estimated_duration: Optional[str] = None
    confidence_score: Optional[float] = None
    raw_response: Optional[str] = None
    analyzed_at: Optional[str] = None


class IssueDetailsField(BaseModel):
    issue_title: Optional[str] = None
    issue_description: Optional[str] = None
    issue_category: Optional[str] = None
    severity: str = "medium"
    expected_budget: Optional[float] = None
    preferred_notes: Optional[str] = None
    issue_images: List[IssueMediaField] = []
    issue_videos: List[IssueMediaField] = []
    voice_recording: Optional[IssueMediaField] = None
    voice_transcript: Optional[str] = None
    ai_analysis: Optional[AIAnalysisField] = None
    estimated_cost: Optional[dict] = None


class BookingCreateSchema(BaseModel):
    request_id: str = Field(..., description="ID of the service request being booked")
    worker_id: str = Field(..., description="ID of the assigned worker")
    issue_details: Optional[IssueDetailsField] = None


class BookingStatusUpdateSchema(BaseModel):
    status: str = Field(
        ...,
        description="One of: pending, accepted, worker_on_the_way, started, completed, cancelled",
    )


class BookingResponseSchema(BaseModel):
    id: str
    request_id: str
    customer_id: str
    worker_id: str
    service_type: str
    location: str
    preferred_date: str
    preferred_time: str
    status: str
    worker_name: Optional[str] = None
    worker_phone: Optional[str] = None
    worker_rating: Optional[float] = None
    issue_details: Optional[dict] = None
    before_images: List[dict] = []
    after_images: List[dict] = []
    warranty: Optional[dict] = None
    worker_quote: Optional[dict] = None
    counter_offer: Optional[dict] = None
    live_tracking: Optional[dict] = None
    amount: Optional[float] = None
    payment_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
