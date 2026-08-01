"""
MongoDB index management.
Call ensure_indexes(db) once on application startup to create all
performance-critical and uniqueness-enforcing indexes.

InMemoryDatabase is silently skipped (it has no create_index method).
"""
import logging

logger = logging.getLogger("onedw.indexes")


async def ensure_indexes(db) -> None:
    """
    Create all indexes for the OneDW collections.
    Safe to call on every startup — MongoDB is idempotent on existing indexes.
    Skipped gracefully when running against the in-memory fallback DB.
    """
    # Detect in-memory DB by checking for the Motor-specific attribute
    if not hasattr(db, "client") and not hasattr(db, "get_collection"):
        # Also skip if the collection objects lack create_index
        try:
            _ = db.users.create_index
        except AttributeError:
            logger.info("In-memory DB detected — skipping index creation.")
            return

    try:
        # ── users ─────────────────────────────────────────────────────────────
        await db.users.create_index("email", unique=True, background=True)
        await db.users.create_index("role", background=True)
        await db.users.create_index(
            [("role", 1), ("is_blocked", 1)], background=True
        )

        # ── workers ───────────────────────────────────────────────────────────
        await db.workers.create_index("user_id", unique=True, background=True)
        await db.workers.create_index(
            [("service_type", 1), ("is_available", 1)], background=True
        )
        await db.workers.create_index(
            [("average_rating", -1)], background=True
        )
        await db.workers.create_index("verification_status", background=True)

        # ── bookings ──────────────────────────────────────────────────────────
        await db.bookings.create_index(
            [("customer_id", 1), ("created_at", -1)], background=True
        )
        await db.bookings.create_index(
            [("worker_id", 1), ("created_at", -1)], background=True
        )
        await db.bookings.create_index("status", background=True)
        await db.bookings.create_index(
            [("status", 1), ("created_at", -1)], background=True
        )

        # ── notifications ─────────────────────────────────────────────────────
        await db.notifications.create_index(
            [("user_id", 1), ("read", 1)], background=True
        )
        await db.notifications.create_index(
            [("user_id", 1), ("created_at", -1)], background=True
        )
        # TTL: auto-delete notifications older than 90 days
        await db.notifications.create_index(
            "created_at",
            expireAfterSeconds=60 * 60 * 24 * 90,
            background=True,
        )

        # ── ratings ───────────────────────────────────────────────────────────
        await db.ratings.create_index("worker_id", background=True)
        await db.ratings.create_index(
            "booking_id", unique=True, background=True
        )
        await db.ratings.create_index("customer_id", background=True)

        # ── reviews ───────────────────────────────────────────────────────────
        await db.reviews.create_index(
            [("is_hidden", 1), ("created_at", -1)], background=True
        )
        await db.reviews.create_index("worker_id", background=True)

        # ── complaints ────────────────────────────────────────────────────────
        await db.complaints.create_index("user_id", background=True)
        await db.complaints.create_index(
            [("status", 1), ("priority", 1)], background=True
        )

        # ── wallet_transactions ───────────────────────────────────────────────
        await db.wallet_transactions.create_index(
            [("user_id", 1), ("created_at", -1)], background=True
        )
        await db.wallet_transactions.create_index("tx_type", background=True)

        # ── wallets ───────────────────────────────────────────────────────────
        await db.wallets.create_index("user_id", unique=True, background=True)

        # ── coupons ───────────────────────────────────────────────────────────
        await db.coupons.create_index("code", unique=True, background=True)

        # ── chat_messages ─────────────────────────────────────────────────────
        await db.chat_messages.create_index(
            [("session_id", 1), ("created_at", 1)], background=True
        )

        # ── requests ─────────────────────────────────────────────────────────
        await db.requests.create_index(
            [("customer_id", 1), ("created_at", -1)], background=True
        )
        await db.requests.create_index("status", background=True)

        logger.info("✓ All MongoDB indexes ensured.")
    except Exception as exc:
        # Non-fatal: indexes are a performance concern, not a correctness one
        logger.warning("Index creation failed (non-fatal): %s", exc)
