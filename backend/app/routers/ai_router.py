"""
AI endpoints:
  - POST /api/nlp/process         — Voice text → structured fields (no auth)
  - POST /api/ai/recommend        — Gemini AI worker recommendation
  - POST /api/ai/chat             — Smart chat with structured Gemini response
  - POST /api/ai/voice-parse      — Alias for NLP process
  - POST /api/ai/chat-history/save — Persist chat session to MongoDB
  - GET  /api/ai/chat-history/{session_id} — Retrieve stored chat history
  - POST /api/ai/image-analyze    — Analyze uploaded image with Gemini Vision
  - POST /api/ai/translate        — Translate text between supported languages
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.ai_schema import (
    NLPProcessRequest,
    NLPProcessResponse,
    AIRecommendRequest,
    AIRecommendResponse,
    AIChatRequest,
    AIChatResponse,
    SaveChatRequest,
    GetChatHistoryResponse,
    ImageAnalysisRequest,
    ImageAnalysisResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.services import gemini_service
from app.services import ai_chat_service
from app.services import ai_analysis_service
from app.services import multilingual_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

router = APIRouter(tags=["AI"])


# ─── Voice NLP ─────────────────────────────────────────────────────────────────

@router.post("/api/nlp/process", response_model=NLPProcessResponse)
async def process_nlp(payload: NLPProcessRequest):
    """
    Parse a voice transcript into structured service request fields using Gemini.
    No authentication required — public AI utility endpoint.
    """
    return await gemini_service.parse_voice_text(payload.text)


@router.post("/api/ai/voice-parse", response_model=NLPProcessResponse)
async def voice_parse(payload: NLPProcessRequest):
    """
    Alias for /api/nlp/process — used by the AI assistant widget.
    No authentication required.
    """
    return await gemini_service.parse_voice_text(payload.text)


# ─── Worker Recommendation ─────────────────────────────────────────────────────

@router.post("/api/ai/recommend", response_model=AIRecommendResponse)
async def recommend_worker(
    payload: AIRecommendRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Use Gemini AI to rank and recommend the best available worker."""
    return await gemini_service.recommend_worker(payload)


# ─── Smart Chat ────────────────────────────────────────────────────────────────

@router.post("/api/ai/chat", response_model=AIChatResponse)
async def ai_chat(payload: AIChatRequest):
    """
    Smart AI chat — structured Gemini diagnostic response with all 7 fields.
    Supports multilingual responses via the `language` field.
    No authentication required so the floating widget works for guests too.
    """
    return await ai_chat_service.process_chat(
        payload.message,
        conversation_history=payload.conversation_history or [],
        language=payload.language or "en",
    )


# ─── Chat History ──────────────────────────────────────────────────────────────

@router.post("/api/ai/chat-history/save")
async def save_chat_history(payload: SaveChatRequest):
    """
    Persist a chat session to MongoDB ai_chat_history collection.
    Uses session_id (stored in localStorage on client) — no auth required.
    Optionally links to user_id when the user is logged in.
    """
    messages_data = [m.model_dump() for m in payload.messages]
    success = await ai_chat_service.save_chat_history(
        session_id=payload.session_id,
        messages=messages_data,
        language=payload.language or "en",
        user_id=payload.user_id,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save chat history")
    return {"status": "saved", "session_id": payload.session_id}


@router.get("/api/ai/chat-history/{session_id}", response_model=GetChatHistoryResponse)
async def get_chat_history(session_id: str):
    """
    Retrieve stored chat history by session ID from MongoDB.
    Returns empty messages list if session not found.
    """
    history = await ai_chat_service.get_chat_history(session_id)
    if not history:
        return GetChatHistoryResponse(
            session_id=session_id,
            messages=[],
            language="en",
        )
    return GetChatHistoryResponse(**history)


# ─── Image Analysis ────────────────────────────────────────────────────────────

@router.post("/api/ai/image-analyze", response_model=ImageAnalysisResponse)
async def analyze_image(payload: ImageAnalysisRequest):
    """
    Analyze an uploaded issue image using Gemini Vision.
    Accepts base64-encoded image data.
    Returns: problem, confidence, severity, estimated_cost, suggested_worker,
             required_materials, safety_advice, and more.
    No authentication required — works in the public AI widget.
    """
    result = await ai_analysis_service.analyze_image_base64(
        image_base64=payload.image_base64,
        image_mime_type=payload.image_mime_type or "image/jpeg",
        service_type=payload.service_type,
        language=payload.language or "en",
    )
    return ImageAnalysisResponse(**result)


# ─── Translation ───────────────────────────────────────────────────────────────

@router.post("/api/ai/translate", response_model=TranslateResponse)
async def translate_text(payload: TranslateRequest):
    """
    Translate text between supported languages using Gemini.
    Supported: en (English), ta (Tamil), hi (Hindi), te (Telugu), ml (Malayalam).
    No authentication required.
    """
    if not multilingual_service.is_supported_language(payload.target_language):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {payload.target_language}. Supported: en, ta, hi, te, ml",
        )
    translated = await multilingual_service.translate_text(
        text=payload.text,
        target_language=payload.target_language,
        source_language=payload.source_language or "en",
    )
    return TranslateResponse(
        translated_text=translated,
        source_language=payload.source_language or "en",
        target_language=payload.target_language,
    )


# ─── Supported Languages ───────────────────────────────────────────────────────

@router.get("/api/ai/languages")
async def get_supported_languages():
    """Return list of supported languages for multilingual AI features."""
    return {
        "languages": [
            {"code": "en", "name": "English", "native": "English", "flag": "🇬🇧"},
            {"code": "ta", "name": "Tamil", "native": "தமிழ்", "flag": "🇮🇳"},
            {"code": "hi", "name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳"},
            {"code": "te", "name": "Telugu", "native": "తెలుగు", "flag": "🇮🇳"},
            {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "flag": "🇮🇳"},
        ]
    }
