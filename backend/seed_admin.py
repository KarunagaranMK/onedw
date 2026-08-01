"""
Seed script: creates the admin user and default promo codes.
Run once: python seed_admin.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.utils.security import hash_password
from datetime import datetime, timezone

ADMIN_EMAIL    = "admin@onedw.in"
ADMIN_PASSWORD = "Admin@123"
ADMIN_NAME     = "OneDW Admin"

DEFAULT_PROMOS = [
    {"code": "WELCOME10", "discount_type": "percent", "discount_value": 10, "max_discount": 100, "is_active": True, "max_uses_per_user": 1},
    {"code": "ONEDW20",   "discount_type": "percent", "discount_value": 20, "max_discount": 200, "is_active": True, "max_uses_per_user": 1},
    {"code": "SAVE50",    "discount_type": "flat",    "discount_value": 50, "max_discount": 50,  "is_active": True, "max_uses_per_user": 1},
    {"code": "FIRST100",  "discount_type": "flat",    "discount_value": 100,"max_discount": 100, "is_active": True, "max_uses_per_user": 1},
    {"code": "REFER25",   "discount_type": "percent", "discount_value": 25, "max_discount": 150, "is_active": True, "max_uses_per_user": 1},
]

DEFAULT_SETTINGS = {
    "platform_commission_percent": 20,
    "referral_bonus": 100,
    "cashback_percent": 5,
    "min_booking_amount": 100,
    "max_booking_amount": 50000,
    "support_email": "support@onedw.in",
    "support_phone": "+91-9999999999",
    "app_version": "3.0.0",
    "maintenance_mode": False,
    "updated_at": datetime.now(timezone.utc),
}


async def seed():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]
    now = datetime.now(timezone.utc)

    # ── Admin User ──────────────────────────────────────────────────────────────
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing_admin:
        # Update role to admin just in case
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"role": "admin"}})
        print(f"✓ Admin user already exists: {ADMIN_EMAIL} (role ensured)")
    else:
        hashed = hash_password(ADMIN_PASSWORD)
        admin_doc = {
            "name": ADMIN_NAME,
            "email": ADMIN_EMAIL,
            "phone": "+911234567890",
            "password": hashed,
            "role": "admin",
            "is_active": True,
            "is_blocked": False,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.users.insert_one(admin_doc)
        print(f"✓ Admin user created: {ADMIN_EMAIL} (id={result.inserted_id})")
        print(f"  Password: {ADMIN_PASSWORD}")

    # ── Default Promo Codes ─────────────────────────────────────────────────────
    for promo in DEFAULT_PROMOS:
        exists = await db.coupons.find_one({"code": promo["code"]})
        if not exists:
            await db.coupons.insert_one({**promo, "created_at": now})
            print(f"✓ Promo code created: {promo['code']}")
        else:
            print(f"  Promo already exists: {promo['code']}")

    # ── Platform Settings ───────────────────────────────────────────────────────
    await db.platform_settings.update_one(
        {"_id": "global"},
        {"$setOnInsert": {**DEFAULT_SETTINGS, "_id": "global"}},
        upsert=True,
    )
    print("✓ Platform settings seeded")

    # ── Summary ─────────────────────────────────────────────────────────────────
    total_users   = await db.users.count_documents({})
    total_workers = await db.workers.count_documents({})
    print(f"\n📊 DB Summary: {total_users} users | {total_workers} workers")
    print(f"\n🔑 Admin Login → http://localhost:5173/admin/login")
    print(f"   Email:    {ADMIN_EMAIL}")
    print(f"   Password: {ADMIN_PASSWORD}")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
