"""
Pydantic schemas for Live Chat, Video Inspection, and Notifications.
Collections: chat_sessions, chat_messages, video_sessions, notifications
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ─── Chat Message ─────────────────────────────────────────────────────────────

class SendMessageSchema(BaseModel):
    content: str = ""
    message_type: Literal["text", "image", "voice", "system"] = "text"
    image_base64: Optional[str] = None   # base64 for image uploads
    image_mime_type: Optional[str] = "image/jpeg"
    voice_base64: Optional[str] = None  # base64 audio for voice messages
    voice_duration: Optional[float] = None  # seconds


class MessageSchema(BaseModel):
    id: str
    session_id: str
    sender_id: str
    sender_name: str
    sender_role: str   # customer | worker | ai
    content: str
    message_type: str = "text"
    image_url: Optional[str] = None
    voice_url: Optional[str] = None
    voice_duration: Optional[float] = None
    is_read: bool = False
    is_ai_reply: bool = False
    created_at: Optional[datetime] = None


# ─── Chat Session ─────────────────────────────────────────────────────────────

class StartSessionSchema(BaseModel):
    worker_id: str
    booking_id: Optional[str] = None


class ChatSessionSchema(BaseModel):
    id: str
    customer_id: str
    customer_name: str
    worker_id: str
    worker_name: str
    booking_id: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_customer: int = 0
    unread_worker: int = 0
    worker_online: bool = False
    created_at: Optional[datetime] = None


# ─── Typing Indicator ─────────────────────────────────────────────────────────

class TypingSchema(BaseModel):
    is_typing: bool


class TypingStateSchema(BaseModel):
    session_id: str
    user_id: str
    is_typing: bool


# ─── Video Session ────────────────────────────────────────────────────────────

class CreateVideoSessionSchema(BaseModel):
    session_id: str            # chat session id this is linked to
    booking_id: Optional[str] = None


class InspectionSummarySchema(BaseModel):
    estimated_cost: Optional[str] = None
    materials_required: Optional[List[str]] = []
    time_required: Optional[str] = None
    worker_notes: Optional[str] = None
    images: Optional[List[str]] = []    # base64 or URLs
    recommendation: Optional[str] = None


class VideoSessionSchema(BaseModel):
    id: str
    chat_session_id: str
    booking_id: Optional[str] = None
    customer_id: str
    worker_id: str
    jitsi_room: str
    status: str = "pending"   # pending | active | ended
    inspection_summary: Optional[InspectionSummarySchema] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationSchema(BaseModel):
    id: str
    user_id: str
    title: str
    body: str
    type: str   # chat | booking | system | payment | review
    reference_id: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None


class MarkReadSchema(BaseModel):
    notification_ids: Optional[List[str]] = None   # None = mark all
