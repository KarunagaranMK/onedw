"""
OneDW Backend — FastAPI application entrypoint.
Wires together config, database lifecycle, middleware, routers, and error handling.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.routers import auth_router, request_router, worker_router, booking_router, ai_router, rating_router, worker_search_router, issue_router
from app.routers.otp_notif_payment_router import otp_router, notif_router, payment_router
from app.routers import review_router, complaint_router, admin_router, wallet_router, chat_router
from app.routers import loyalty_router


from app.config import settings
from app.database.connection import (
    connect_to_mongo,
    close_mongo_connection,
    check_db_health,
    get_database,
)
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("onedw.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup/shutdown: connect DB on start, close it on shutdown."""
    await connect_to_mongo()
    logger.info(f"OneDW backend started in '{settings.app_env}' mode.")

    # ── Auto-seed admin user and default data ──────────────────────────────
    try:
        from app.database.indexes import ensure_indexes
        from app.utils.security import hash_password
        from datetime import datetime, timezone

        db = await anext(get_database())
        now = datetime.now(timezone.utc)

        # Ensure all indexes exist (skipped gracefully for InMemoryDB)
        await ensure_indexes(db)

        # Create admin user if missing
        admin = await db.users.find_one({"role": "admin"})
        if not admin:
            hashed = hash_password("Admin@123")
            await db.users.insert_one({
                "name": "OneDW Admin",
                "email": "admin@onedw.in",
                "phone": "+911234567890",
                "password": hashed,
                "role": "admin",
                "is_active": True,
                "is_blocked": False,
                "created_at": now,
                "updated_at": now,
            })
            logger.info("✓ Admin user seeded: admin@onedw.in / Admin@123")
        else:
            logger.info(f"✓ Admin exists: {admin.get('email')}")

        # Seed default promo codes
        DEFAULT_PROMOS = [
            {"code": "WELCOME10", "discount_type": "percent", "discount_value": 10, "max_discount": 100, "is_active": True, "max_uses_per_user": 1},
            {"code": "ONEDW20",   "discount_type": "percent", "discount_value": 20, "max_discount": 200, "is_active": True, "max_uses_per_user": 1},
            {"code": "SAVE50",    "discount_type": "flat",    "discount_value": 50,  "max_discount": 50,  "is_active": True, "max_uses_per_user": 1},
            {"code": "FIRST100",  "discount_type": "flat",    "discount_value": 100, "max_discount": 100, "is_active": True, "max_uses_per_user": 1},
            {"code": "REFER25",   "discount_type": "percent", "discount_value": 25, "max_discount": 150, "is_active": True, "max_uses_per_user": 1},
        ]
        for promo in DEFAULT_PROMOS:
            exists = await db.coupons.find_one({"code": promo["code"]})
            if not exists:
                await db.coupons.insert_one({**promo, "created_at": now})

        # Seed platform settings
        await db.platform_settings.update_one(
            {"_id": "global"},
            {"$setOnInsert": {
                "_id": "global",
                "platform_commission_percent": 20,
                "referral_bonus": 100,
                "cashback_percent": 5,
                "min_booking_amount": 100,
                "support_email": "support@onedw.in",
                "maintenance_mode": False,
                "updated_at": now,
            }},
            upsert=True,
        )
        logger.info("✓ Seed data initialised")
    except Exception as e:
        logger.warning(f"Seed skipped: {e}")
    # ──────────────────────────────────────────────────────────────────────────

    yield
    await close_mongo_connection()
    logger.info("OneDW backend shut down cleanly.")


app = FastAPI(
    title="OneDW API",
    description="AI-powered Hyperlocal Home Services Platform — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"(http://(localhost|127\.0\.0\.1)(:[0-9]+)?|https://.*\.vercel\.app|https://.*\.onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Middleware
# -------------------------
app.add_middleware(LoggingMiddleware)

# -------------------------
# Exception Handlers
# -------------------------
app.add_exception_handler(
    StarletteHTTPException,
    http_exception_handler,
)

app.add_exception_handler(
    RequestValidationError,
    validation_exception_handler,
)

app.add_exception_handler(
    Exception,
    unhandled_exception_handler,
)

# -------------------------
# Routers
# -------------------------
app.include_router(auth_router.router)
app.include_router(request_router.router)
app.include_router(worker_router.router)
app.include_router(booking_router.router)
app.include_router(ai_router.router)
app.include_router(rating_router.router)
app.include_router(worker_search_router.router)
app.include_router(otp_router)
app.include_router(notif_router)
app.include_router(payment_router)
app.include_router(issue_router.router)
app.include_router(review_router.router)
app.include_router(complaint_router.router)
app.include_router(admin_router.router)
app.include_router(wallet_router.router)
app.include_router(chat_router.router)
app.include_router(loyalty_router.router)


# -------------------------
# Root
# -------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "OneDW API is running.",
        "docs": "/docs",
    }


# -------------------------
# Health Check
# -------------------------
@app.get("/health", tags=["Health"])
async def health_check():
    db_ok = await check_db_health()

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": db_ok,
        "env": settings.app_env,
    }