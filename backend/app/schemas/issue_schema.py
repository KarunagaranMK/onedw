"""
Pydantic schemas for the Smart Issue Reporting System.
Covers issue details, media uploads, AI analysis, warranty, and counter-offers.
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ─────────────────────────────────────────────────────────────────────

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    VOICE = "voice"


class WarrantyDuration(int, Enum):
    SEVEN = 7
    FIFTEEN = 15
    THIRTY = 30
    NINETY = 90


# ─── Issue Details ─────────────────────────────────────────────────────────────

class IssueMediaSchema(BaseModel):
    url: str
    media_type: MediaType
    filename: Optional[str] = None
    size: Optional[int] = None
    thumbnail_url: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class AIAnalysisResultSchema(BaseModel):
    possible_problems: List[str] = []
    estimated_difficulty: Optional[str] = None
    recommended_worker: Optional[str] = None
    estimated_duration: Optional[str] = None
    confidence_score: Optional[float] = None
    raw_response: Optional[str] = None
    analyzed_at: Optional[datetime] = None


class IssueDetailsSchema(BaseModel):
    model_config = ConfigDict(extra="allow")

    issue_title: str = Field(..., min_length=3, max_length=200, description="Brief title of the issue")
    issue_description: str = Field(..., min_length=10, max_length=2000, description="Detailed description")
    issue_category: str = Field(..., min_length=2, max_length=100, description="Category of the problem")
    severity: SeverityLevel = SeverityLevel.MEDIUM
    expected_budget: Optional[float] = Field(None, ge=0, le=100000, description="Expected budget in INR")
    preferred_notes: Optional[str] = Field(None, max_length=500, description="Visit instructions like ring bell, come after 6 PM")
    issue_images: List[IssueMediaSchema] = []
    issue_videos: List[IssueMediaSchema] = []
    voice_recording: Optional[IssueMediaSchema] = None
    voice_transcript: Optional[str] = None
    ai_analysis: Optional[AIAnalysisResultSchema] = None
    estimated_cost: Optional[dict] = None


class IssueDetailsUpdateSchema(BaseModel):
    issue_title: Optional[str] = Field(None, min_length=3, max_length=200)
    issue_description: Optional[str] = Field(None, min_length=10, max_length=2000)
    issue_category: Optional[str] = Field(None, min_length=2, max_length=100)
    severity: Optional[SeverityLevel] = None
    expected_budget: Optional[float] = Field(None, ge=0, le=100000)
    preferred_notes: Optional[str] = Field(None, max_length=500)


# ─── Media Upload ──────────────────────────────────────────────────────────────

class MediaUploadResponse(BaseModel):
    url: str
    media_type: MediaType
    filename: str
    size: int
    thumbnail_url: Optional[str] = None


# ─── Voice Transcription ──────────────────────────────────────────────────────

class VoiceTranscriptionRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the uploaded voice recording")


class VoiceTranscriptionResponse(BaseModel):
    transcript: str
    language: Optional[str] = None
    confidence: Optional[float] = None


# ─── AI Image Analysis ────────────────────────────────────────────────────────

class ImageAnalysisRequest(BaseModel):
    image_url: str = Field(..., description="URL of the uploaded image")
    service_type: Optional[str] = None


class ImageAnalysisResponse(BaseModel):
    possible_problems: List[str] = []
    estimated_difficulty: Optional[str] = None
    recommended_worker: Optional[str] = None
    estimated_duration: Optional[str] = None
    confidence_score: Optional[float] = None
    raw_response: Optional[str] = None


# ─── Cost Estimation ──────────────────────────────────────────────────────────

class CostEstimationRequest(BaseModel):
    service_type: str
    issue_category: str
    severity: SeverityLevel = SeverityLevel.MEDIUM
    image_count: int = 0


class CostEstimationResponse(BaseModel):
    min_cost: float
    max_cost: float
    average_cost: float
    currency: str = "INR"
    note: Optional[str] = None


# ─── Before/After Photos ──────────────────────────────────────────────────────

class BeforeAfterImagesSchema(BaseModel):
    images: List[IssueMediaSchema]


# ─── Warranty ──────────────────────────────────────────────────────────────────

class WarrantyCreateSchema(BaseModel):
    booking_id: str
    duration_days: int = Field(..., description="Warranty duration in days: 7, 15, 30, or 90")
    covered_services: List[str] = []
    notes: Optional[str] = None

    @field_validator("duration_days")
    @classmethod
    def validate_duration(cls, v):
        allowed = {7, 15, 30, 90}
        if v not in allowed:
            raise ValueError(f"Duration must be one of {sorted(allowed)} days")
        return v


class WarrantyResponseSchema(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    worker_id: str
    service_type: str
    duration_days: int
    start_date: datetime
    end_date: datetime
    covered_services: List[str] = []
    status: str = "active"
    issue_photos: List[str] = []
    notes: Optional[str] = None
    created_at: datetime


class WarrantyClaimSchema(BaseModel):
    warranty_id: str
    description: str = Field(..., min_length=10, max_length=1000)
    issue_images: List[IssueMediaSchema] = []


# ─── Counter Offer ─────────────────────────────────────────────────────────────

class CounterOfferSchema(BaseModel):
    booking_id: str
    estimated_price: float = Field(..., gt=0, description="Worker's proposed price")
    message: Optional[str] = Field(None, max_length=500)
    estimated_duration: Optional[str] = Field(None, max_length=100)


class CounterOfferResponseSchema(BaseModel):
    id: str
    booking_id: str
    worker_id: str
    customer_id: str
    estimated_price: float
    message: Optional[str] = None
    estimated_duration: Optional[str] = None
    status: str = "pending"
    created_at: datetime


# ─── Enhanced Rating ───────────────────────────────────────────────────────────

class EnhancedRatingCreateSchema(BaseModel):
    booking_id: str
    worker_id: str
    stars: int = Field(..., ge=1, le=5)
    review: Optional[str] = Field(None, max_length=1000)
    punctuality: Optional[int] = Field(None, ge=1, le=5)
    behavior: Optional[int] = Field(None, ge=1, le=5)
    work_quality: Optional[int] = Field(None, ge=1, le=5)
    communication: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    cleanliness: Optional[int] = Field(None, ge=1, le=5)
    recommend: bool = True
    review_images: List[IssueMediaSchema] = []
    review_videos: List[IssueMediaSchema] = []


class EnhancedRatingResponseSchema(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    worker_id: str
    stars: int
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


# ─── Issue History ─────────────────────────────────────────────────────────────

class IssueHistoryEntrySchema(BaseModel):
    booking_id: str
    service_type: str
    issue_title: str
    issue_description: str
    severity: str
    worker_name: Optional[str] = None
    worker_rating: Optional[float] = None
    cost: Optional[float] = None
    images: List[str] = []
    created_at: datetime


# ─── Live Tracking ─────────────────────────────────────────────────────────────

class LiveTrackingSchema(BaseModel):
    booking_id: str
    worker_lat: Optional[float] = None
    worker_lon: Optional[float] = None
    eta_minutes: Optional[int] = None
    distance_km: Optional[float] = None
    status: str
    updated_at: Optional[datetime] = None
