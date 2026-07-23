"""
Reusable FastAPI dependencies — primarily for extracting and validating
the current authenticated user from a JWT bearer token.

After backend restart the in-memory DB is wiped, but the JWT is still
cryptographically valid. We embed name/email/role/phone in the token so
we can reconstruct a minimal user object without a DB round-trip.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from app.utils.security import decode_access_token
from app.database.connection import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    """
    Decode the bearer token and return the authenticated user.

    Priority:
      1. Decode and validate the JWT signature.
      2. Try to fetch the user from the database (real or in-memory).
      3. If the user is NOT found in DB (e.g. in-memory DB was reset after
         a server restart), fall back to reconstructing the user object
         from the JWT claims — which are embedded at login/register time.
         This makes the app resilient to hot-reloads during development.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    # ── Attempt DB lookup ──────────────────────────────────────────────────
    user = None
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except (InvalidId, Exception):
        pass

    if user is not None:
        user["_id"] = str(user["_id"])
        return user

    # ── Fallback: reconstruct user from JWT claims ─────────────────────────
    # This happens when the in-memory DB was wiped after a server restart.
    # The token is cryptographically valid so we trust its embedded claims.
    name  = payload.get("name")
    email = payload.get("email")
    role  = payload.get("role")

    if not email or not role:
        # Token has no embedded user info — cannot trust it
        raise credentials_exception

    # Re-insert the user into the in-memory DB so future DB lookups succeed
    try:
        from bson import ObjectId as OID
        from datetime import datetime, timezone
        new_user_doc = {
            "_id": OID(user_id),
            "name": name or email.split("@")[0],
            "email": email,
            "phone": payload.get("phone", ""),
            "role": role,
            "password_hash": "",
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one(new_user_doc)
    except Exception:
        pass  # Insert might fail if _id already exists; that's fine

    return {
        "_id": user_id,
        "name": name or email.split("@")[0],
        "email": email,
        "phone": payload.get("phone", ""),
        "role": role,
        "is_active": True,
    }