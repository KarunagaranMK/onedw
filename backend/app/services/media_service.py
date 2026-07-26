"""
Media upload service — handles image, video, and voice uploads.
Supports Cloudinary when configured, falls back to local file storage.
"""
import os
import uuid
import logging
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException
from datetime import datetime, timezone

from app.config import settings

logger = logging.getLogger("onedw.media")

LOCAL_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/mov"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/mp3", "audio/wav", "audio/x-m4a", "audio/m4a"}
MAX_IMAGE_SIZE = 20 * 1024 * 1024
MAX_VIDEO_SIZE = 100 * 1024 * 1024
MAX_AUDIO_SIZE = 25 * 1024 * 1024


def _cloudinary_configured() -> bool:
    return bool(os.environ.get("CLOUDINARY_URL") or (
        os.environ.get("CLOUDINARY_CLOUD_NAME") and
        os.environ.get("CLOUDINARY_API_KEY") and
        os.environ.get("CLOUDINARY_API_SECRET")
    ))


def _get_cloudinary():
    if not _cloudinary_configured():
        return None
    try:
        import cloudinary
        import cloudinary.uploader
        if os.environ.get("CLOUDINARY_URL"):
            cloudinary.config(secure=True)
        else:
            cloudinary.config(
                cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
                api_key=os.environ.get("CLOUDINARY_API_KEY"),
                api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
                secure=True,
            )
        return cloudinary.uploader
    except Exception as exc:
        logger.warning("Cloudinary init failed: %s", exc)
        return None


def _classify_upload(content_type: str) -> str:
    if content_type in ALLOWED_IMAGE_TYPES:
        return "image"
    if content_type in ALLOWED_VIDEO_TYPES:
        return "video"
    if content_type in ALLOWED_AUDIO_TYPES:
        return "voice"
    return "unknown"


def _validate_file(content_type: str, size: int):
    media_type = _classify_upload(content_type)
    if media_type == "unknown":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WebP, MP4, MOV, MP3, WAV, M4A",
        )
    if media_type == "image" and size > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"Image too large. Maximum size: {MAX_IMAGE_SIZE // (1024*1024)}MB")
    if media_type == "video" and size > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=400, detail=f"Video too large. Maximum size: {MAX_VIDEO_SIZE // (1024*1024)}MB")
    if media_type == "voice" and size > MAX_AUDIO_SIZE:
        raise HTTPException(status_code=400, detail=f"Audio too large. Maximum size: {MAX_AUDIO_SIZE // (1024*1024)}MB")


def _generate_filename(original: str, media_type: str) -> str:
    ext_map = {
        "image": {".jpg": ".jpg", ".jpeg": ".jpg", ".png": ".png", ".webp": ".webp"},
        "video": {".mp4": ".mp4", ".mov": ".mov"},
        "voice": {".mp3": ".mp3", ".wav": ".wav", ".m4a": ".m4a"},
    }
    suffix = Path(original).suffix.lower()
    valid_exts = ext_map.get(media_type, {})
    ext = valid_exts.get(suffix, suffix or ".bin")
    uid = uuid.uuid4().hex[:16]
    return f"onedw/{media_type}/{uid}{ext}"


async def upload_media(file: UploadFile) -> dict:
    content = await file.read()
    size = len(content)
    content_type = file.content_type or "application/octet-stream"
    _validate_file(content_type, size)
    media_type = _classify_upload(content_type)
    filename = _generate_filename(file.filename or "upload", media_type)

    uploader = _get_cloudinary()
    if uploader is not None:
        try:
            import io
            resource_type = "video" if media_type == "video" else "raw" if media_type == "voice" else "image"
            result = uploader.upload(
                io.BytesIO(content),
                public_id=filename,
                resource_type=resource_type,
                folder="onedw",
            )
            url = result.get("secure_url") or result.get("url", "")
            thumbnail = None
            if media_type == "image":
                thumbnail = url.replace("/upload/", "/upload/w_200,h_200,c_fill/")
            logger.info("Uploaded to Cloudinary: %s", filename)
            return {
                "url": url,
                "media_type": media_type,
                "filename": Path(filename).name,
                "size": size,
                "thumbnail_url": thumbnail,
            }
        except Exception as exc:
            logger.warning("Cloudinary upload failed, falling back to local: %s", exc)

    local_path = LOCAL_UPLOAD_DIR / filename
    local_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(local_path, "wb") as f:
        await f.write(content)

    base_url = "/api/issues/media/files"
    url = f"{base_url}/{filename}"
    logger.info("Uploaded locally: %s", local_path)
    return {
        "url": url,
        "media_type": media_type,
        "filename": Path(filename).name,
        "size": size,
        "thumbnail_url": url if media_type == "image" else None,
    }


def get_local_file_path(filename: str) -> str:
    full_path = (LOCAL_UPLOAD_DIR / filename).resolve()
    if not str(full_path).startswith(str(LOCAL_UPLOAD_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path.")
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return str(full_path)
