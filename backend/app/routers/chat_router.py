"""
Chat REST API + WebSocket endpoints.
WebSocket: /api/ws/chat/{session_id}?token=<JWT>
REST:      /api/chat/...  and  /api/video/...  and  /api/chat-notifications/...
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.chat_schema import (
    StartSessionSchema, ChatSessionSchema, MessageSchema,
    SendMessageSchema, TypingSchema, TypingStateSchema,
    CreateVideoSessionSchema, InspectionSummarySchema, VideoSessionSchema,
    NotificationSchema, MarkReadSchema,
)
from app.services import chat_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user
from app.utils.security import decode_access_token

logger = logging.getLogger("onedw.chat.router")

router = APIRouter(tags=["Chat & Video"])

# ─── WebSocket Connection Manager ─────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        # session_id -> list of (websocket, user_id)
        self.active: dict[str, list] = {}

    async def connect(self, session_id: str, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if session_id not in self.active:
            self.active[session_id] = []
        self.active[session_id].append((websocket, user_id))
        logger.info(f"WS connected: user={user_id} session={session_id}")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active:
            self.active[session_id] = [(ws, uid) for ws, uid in self.active[session_id] if ws != websocket]

    async def broadcast(self, session_id: str, message: dict, exclude_ws: WebSocket = None):
        if session_id not in self.active:
            return
        dead = []
        for ws, uid in self.active[session_id]:
            if ws == exclude_ws:
                continue
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(ws)
        self.active[session_id] = [(ws, uid) for ws, uid in self.active[session_id] if ws not in dead]

    async def send_to_user(self, session_id: str, user_id: str, message: dict):
        if session_id not in self.active:
            return
        for ws, uid in self.active[session_id]:
            if uid == user_id:
                try:
                    await ws.send_text(json.dumps(message, default=str))
                except Exception:
                    pass

    def is_user_online(self, session_id: str, user_id: str) -> bool:
        if session_id not in self.active:
            return False
        return any(uid == user_id for _, uid in self.active[session_id])


manager = ConnectionManager()


# ─── WebSocket ────────────────────────────────────────────────────────────────

@router.websocket("/api/ws/chat/{session_id}")
async def websocket_chat(
    session_id: str,
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Real-time bidirectional chat over WebSocket."""
    # Authenticate via token
    try:
        payload = decode_access_token(token)
        user_id   = payload.get("sub")
        user_role = payload.get("role", "customer")
        user_name = payload.get("name", "User")
        if not user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(session_id, websocket, user_id)

    # Mark worker as online
    if user_role == "worker":
        await chat_service.set_worker_online(db, user_id, True)
        await manager.broadcast(session_id, {"type": "online_status", "data": {"worker_online": True}})

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except Exception:
                continue

            event_type = data.get("type", "message")

            if event_type == "message":
                msg_data = SendMessageSchema(
                    content=data.get("content", ""),
                    message_type=data.get("message_type", "text"),
                    media_url=data.get("media_url"),
                )
                saved = await chat_service.send_message(
                    db, session_id, user_id, user_name, user_role, msg_data
                )
                await manager.broadcast(session_id, {"type": "message", "data": saved})

                # If AI reply was generated (worker offline), fetch and broadcast it too
                messages = await chat_service.get_messages(db, session_id, skip=0, limit=2)
                if messages and messages[-1].get("is_ai_reply"):
                    await manager.broadcast(session_id, {"type": "message", "data": messages[-1]})

            elif event_type == "typing":
                is_typing = data.get("is_typing", False)
                await chat_service.set_typing(db, session_id, user_id, is_typing)
                await manager.broadcast(
                    session_id,
                    {"type": "typing", "data": {"user_id": user_id, "is_typing": is_typing}},
                    exclude_ws=websocket,
                )

            elif event_type == "read":
                await chat_service.mark_messages_read(db, session_id, user_id, user_role)
                await manager.broadcast(
                    session_id,
                    {"type": "read", "data": {"reader_id": user_id}},
                    exclude_ws=websocket,
                )

            elif event_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        if user_role == "worker":
            await chat_service.set_worker_online(db, user_id, False)
            await manager.broadcast(session_id, {"type": "online_status", "data": {"worker_online": False}})
        logger.info(f"WS disconnected: user={user_id} session={session_id}")


# ─── Chat Session REST ─────────────────────────────────────────────────────────
# NOTE: All paths here are RELATIVE (no /api prefix) because main.py mounts
# the router without a prefix — FastAPI will path them exactly as written.

@router.post("/api/chat/session", tags=["Chat"])
async def start_session(
    payload: StartSessionSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Start or get a chat session with a worker."""
    return await chat_service.get_or_create_session(db, current_user["_id"], payload)


@router.get("/api/chat/sessions", tags=["Chat"])
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """List all chat sessions for current user."""
    return await chat_service.list_sessions(db, current_user["_id"], current_user.get("role", "customer"))


@router.get("/api/chat/{session_id}", tags=["Chat"])
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get chat session details."""
    session = await chat_service.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/api/chat/{session_id}/messages", tags=["Chat"])
async def get_messages(
    session_id: str,
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Paginated message history."""
    return await chat_service.get_messages(db, session_id, skip=skip, limit=limit)


@router.post("/api/chat/{session_id}/send", tags=["Chat"])
async def send_message(
    session_id: str,
    payload: SendMessageSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Send a message (REST fallback when WebSocket is unavailable)."""
    return await chat_service.send_message(
        db, session_id,
        current_user["_id"],
        current_user.get("name", "User"),
        current_user.get("role", "customer"),
        payload,
    )


@router.post("/api/chat/{session_id}/read", tags=["Chat"])
async def mark_read(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Mark all messages in session as read."""
    await chat_service.mark_messages_read(db, session_id, current_user["_id"], current_user.get("role", "customer"))
    return {"status": "ok"}


@router.get("/api/chat/{session_id}/typing", tags=["Chat"])
async def get_typing(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await chat_service.get_typing_state(db, session_id, current_user["_id"])


@router.post("/api/chat/{session_id}/typing", tags=["Chat"])
async def set_typing(
    session_id: str,
    payload: TypingSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    await chat_service.set_typing(db, session_id, current_user["_id"], payload.is_typing)
    return {"status": "ok"}


# ─── Video Session REST ────────────────────────────────────────────────────────

@router.post("/api/video/session", tags=["Video"])
async def create_video_session(
    payload: CreateVideoSessionSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Create a video inspection session (Jitsi Meet room)."""
    session = await chat_service.get_session(db, payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    customer_id = session["customer_id"]
    worker_id   = session["worker_id"]

    return await chat_service.create_video_session(
        db, customer_id, worker_id, payload.session_id, payload.booking_id
    )


@router.get("/api/video/{video_session_id}", tags=["Video"])
async def get_video_session(
    video_session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    session = await chat_service.get_video_session(db, video_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Video session not found")
    return session


@router.post("/api/video/{video_session_id}/summary", tags=["Video"])
async def save_inspection_summary(
    video_session_id: str,
    payload: InspectionSummarySchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker saves inspection findings after the video call."""
    return await chat_service.save_inspection_summary(db, video_session_id, payload)


# ─── Chat Notifications REST ───────────────────────────────────────────────────
# Using /api/chat-notifications/ prefix to avoid collision with the existing
# otp_notif_payment_router which already owns /api/notifications/

@router.get("/api/chat-notifications", tags=["Chat Notifications"])
async def get_chat_notifications(
    limit: int = Query(30),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get chat notifications for current user."""
    return await chat_service.get_notifications(db, current_user["_id"], limit=limit)


@router.get("/api/chat-notifications/unread-count", tags=["Chat Notifications"])
async def unread_count(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    count = await chat_service.get_unread_notification_count(db, current_user["_id"])
    return {"count": count}


@router.post("/api/chat-notifications/read", tags=["Chat Notifications"])
async def mark_chat_notifications_read(
    payload: MarkReadSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Mark chat notifications as read."""
    await chat_service.mark_notifications_read(db, current_user["_id"], payload.notification_ids)
    return {"status": "ok"}
