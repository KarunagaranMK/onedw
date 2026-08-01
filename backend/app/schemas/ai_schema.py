"""
Pydantic schemas for the AI/NLP endpoints:
  - NLP voice text → structured request fields (Phase 3)
  - Worker recommendation (Phase 6)
  - AI smart chat with structured response (Phase 7)
  - Chat history persistence
  - Image analysis (Vision API)
  - Multilingual translation
"""
from pydantic import BaseModel, Field
from typing import Optional, List


# ─── Phase 3: Voice NLP ────────────────────────────────────────────────────

class NLPProcessRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw voice transcript to parse")


class NLPProcessResponse(BaseModel):
    raw_text: str
    service: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None


# ─── Phase 6: Worker Recommendation ────────────────────────────────────────

class AIRecommendCandidate(BaseModel):
    worker_id: str
    name: str
    skills: List[str] = []
    experience_years: int = 0
    average_rating: float = 0.0
    total_jobs: int = 0
    distance_km: float = 0.0
    is_available: bool = True


class AIRecommendRequest(BaseModel):
    service_type: str
    customer_latitude: float = 0.0
    customer_longitude: float = 0.0
    candidates: List[AIRecommendCandidate]


class AIRecommendResponse(BaseModel):
    top_worker_id: str
    reason: str
    confidence: float
    ranking: List[str]


# ── AI Smart Chat ─────────────────────────────────────────────────────────────

class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_history: Optional[List[dict]] = []
    language: Optional[str] = "en"          # en | ta | hi | te | ml
    session_id: Optional[str] = None        # for chat history persistence


class AIChatResponse(BaseModel):
    reply: str
    recommended_service: Optional[str] = None
    severity_rating: Optional[int] = None   # 1-5
    emergency_flag: bool = False
    emergency_keywords: Optional[List[str]] = []
    pre_booking_tips: Optional[List[str]] = []
    estimated_price_range: Optional[str] = None
    suggested_worker_category: Optional[str] = None
    # Structured diagnostic fields
    problem_detected: Optional[str] = None
    possible_causes: Optional[List[str]] = []
    recommended_worker: Optional[str] = None
    safety_tips: Optional[List[str]] = []
    estimated_repair_cost: Optional[str] = None
    estimated_repair_time: Optional[str] = None
    preventive_maintenance_tips: Optional[List[str]] = []


# ── Chat History ──────────────────────────────────────────────────────────────

class ChatHistoryEntry(BaseModel):
    role: str                               # "user" | "assistant"
    content: str
    timestamp: Optional[str] = None


class SaveChatRequest(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    messages: List[ChatHistoryEntry]
    language: Optional[str] = "en"


class GetChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatHistoryEntry]
    language: Optional[str] = "en"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Image Analysis ────────────────────────────────────────────────────────────

class ImageAnalysisRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image data")
    image_mime_type: Optional[str] = "image/jpeg"
    service_type: Optional[str] = None
    language: Optional[str] = "en"


class ImageAnalysisResponse(BaseModel):
    problem: Optional[str] = None
    confidence: Optional[float] = None          # 0.0 – 1.0
    severity: Optional[str] = None              # Low | Medium | High | Critical
    estimated_cost: Optional[str] = None
    suggested_worker: Optional[str] = None
    required_materials: Optional[List[str]] = []
    safety_advice: Optional[List[str]] = []
    possible_problems: Optional[List[str]] = []
    estimated_difficulty: Optional[str] = None
    estimated_duration: Optional[str] = None
    additional_notes: Optional[str] = None
    analyzed_at: Optional[str] = None


# ── Multilingual ──────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    target_language: str = Field(..., description="en | ta | hi | te | ml")
    source_language: Optional[str] = "en"


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
