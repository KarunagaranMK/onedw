"""
Customer Loyalty Program service (Phase 18).
Handles point earning, redemption, badges, tiers, and leaderboard.
"""
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets
import string


# ─── Constants ────────────────────────────────────────────────────────────────

TIER_THRESHOLDS = {
    "Bronze":   (0, 499),
    "Silver":   (500, 1499),
    "Gold":     (1500, 3999),
    "Platinum": (4000, float("inf")),
}

TIER_ORDER = ["Bronze", "Silver", "Gold", "Platinum"]

BADGES = [
    {"id": "first_booking",    "name": "First Step",        "description": "Completed your first booking",       "icon": "🎯", "trigger": "bookings_completed", "threshold": 1},
    {"id": "booking_5",        "name": "Regular",           "description": "Completed 5 bookings",               "icon": "⭐", "trigger": "bookings_completed", "threshold": 5},
    {"id": "booking_10",       "name": "Loyal Customer",    "description": "Completed 10 bookings",              "icon": "🏆", "trigger": "bookings_completed", "threshold": 10},
    {"id": "booking_25",       "name": "Power User",        "description": "Completed 25 bookings",              "icon": "💎", "trigger": "bookings_completed", "threshold": 25},
    {"id": "first_review",     "name": "Critic",            "description": "Left your first review",             "icon": "✍️", "trigger": "reviews_count", "threshold": 1},
    {"id": "review_5",         "name": "Voice of the City", "description": "Left 5 reviews",                     "icon": "📣", "trigger": "reviews_count", "threshold": 5},
    {"id": "referral_1",       "name": "Ambassador",        "description": "Referred your first friend",         "icon": "🤝", "trigger": "referrals_count", "threshold": 1},
    {"id": "referral_5",       "name": "Influencer",        "description": "Referred 5 friends",                 "icon": "🌟", "trigger": "referrals_count", "threshold": 5},
    {"id": "silver_tier",      "name": "Silver Member",     "description": "Reached Silver tier",                "icon": "🥈", "trigger": "tier_reached", "tier": "Silver"},
    {"id": "gold_tier",        "name": "Gold Member",       "description": "Reached Gold tier",                  "icon": "🥇", "trigger": "tier_reached", "tier": "Gold"},
    {"id": "platinum_tier",    "name": "Platinum Elite",    "description": "Reached Platinum tier",              "icon": "💎", "trigger": "tier_reached", "tier": "Platinum"},
    {"id": "profile_complete", "name": "Profile Pro",       "description": "Completed your profile",             "icon": "✅", "trigger": "profile_complete", "threshold": 1},
]

REWARDS = [
    {"id": "wallet_10",   "name": "₹10 Wallet Credit",   "description": "Redeem 100 points for ₹10 wallet credit",   "points_required": 100,  "reward_type": "wallet_credit",    "reward_value": 10,  "icon": "💰"},
    {"id": "discount_10", "name": "10% Discount Coupon", "description": "Redeem 200 points for 10% discount coupon", "points_required": 200,  "reward_type": "discount_coupon",  "reward_value": 10,  "icon": "🏷️"},
    {"id": "wallet_60",   "name": "₹60 Wallet Credit",   "description": "Redeem 500 points for ₹60 wallet credit",   "points_required": 500,  "reward_type": "wallet_credit",    "reward_value": 60,  "icon": "💳"},
    {"id": "discount_20", "name": "20% Discount Coupon", "description": "Redeem 800 points for 20% discount coupon", "points_required": 800,  "reward_type": "discount_coupon",  "reward_value": 20,  "icon": "🎟️"},
    {"id": "wallet_150",  "name": "₹150 Wallet Credit",  "description": "Redeem 1000 points for ₹150 wallet credit", "points_required": 1000, "reward_type": "wallet_credit",    "reward_value": 150, "icon": "🎁"},
    {"id": "free_service","name": "Free Inspection",     "description": "Redeem 1500 pts for free home inspection",  "points_required": 1500, "reward_type": "discount_coupon",  "reward_value": 100, "icon": "🔧"},
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _calculate_tier(points: int) -> str:
    for tier, (low, high) in TIER_THRESHOLDS.items():
        if low <= points <= high:
            return tier
    return "Platinum"


def _generate_referral_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return "ODW" + "".join(secrets.choice(chars) for _ in range(length))


def _serialize_account(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    return out


def _serialize_history(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    return out


# ─── Account Management ───────────────────────────────────────────────────────

async def get_or_create_loyalty_account(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Get or create a loyalty account for a user."""
    account = await db.loyalty_accounts.find_one({"user_id": str(user_id)})
    if not account:
        # Find user to check existing data
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)}) or {}
        except Exception:
            user = {}

        account_doc = {
            "_id": ObjectId(),
            "user_id": str(user_id),
            "name": user.get("name", ""),
            "points": 0,
            "tier": "Bronze",
            "total_earned": 0,
            "total_redeemed": 0,
            "badges": [],
            "referral_code": _generate_referral_code(),
            "bookings_completed": 0,
            "reviews_count": 0,
            "referrals_count": 0,
            "profile_complete": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await db.loyalty_accounts.insert_one(account_doc)
        account = account_doc
    return _serialize_account(account)


async def get_my_loyalty(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Get a customer's loyalty account with tier and badges."""
    account = await get_or_create_loyalty_account(db, user_id)
    return account


async def get_points_history(db: AsyncIOMotorDatabase, user_id: str) -> list[dict]:
    """Get a customer's points earn/redeem history."""
    cursor = db.loyalty_history.find({"user_id": str(user_id)}).sort("created_at", -1).limit(50)
    docs = await cursor.to_list(length=None)
    return [_serialize_history(d) for d in docs]


async def get_available_rewards(db: AsyncIOMotorDatabase) -> list[dict]:
    """Return the static rewards catalog."""
    return REWARDS


async def get_all_badges(db: AsyncIOMotorDatabase) -> list[dict]:
    """Return all possible badges."""
    return BADGES


async def get_leaderboard(db: AsyncIOMotorDatabase, limit: int = 20) -> list[dict]:
    """Top customers by points."""
    cursor = db.loyalty_accounts.find({}).sort("points", -1).limit(limit)
    docs = await cursor.to_list(length=None)
    result = []
    for i, doc in enumerate(docs):
        result.append({
            "rank": i + 1,
            "user_id": doc.get("user_id", ""),
            "name": doc.get("name", "Anonymous"),
            "points": doc.get("points", 0),
            "tier": doc.get("tier", "Bronze"),
            "badges_count": len(doc.get("badges", [])),
        })
    return result


# ─── Point Awarding ───────────────────────────────────────────────────────────

async def _add_points(
    db: AsyncIOMotorDatabase,
    user_id: str,
    points: int,
    reason: str,
    description: str,
    booking_id: str = None,
) -> dict:
    """Internal: add points to a user's account and log the history."""
    account = await get_or_create_loyalty_account(db, user_id)

    new_points = account["points"] + points
    new_total_earned = account["total_earned"] + points
    new_tier = _calculate_tier(new_points)

    await db.loyalty_accounts.update_one(
        {"user_id": str(user_id)},
        {"$set": {
            "points": new_points,
            "tier": new_tier,
            "total_earned": new_total_earned,
            "updated_at": datetime.now(timezone.utc),
        }},
    )

    # Log history
    history_doc = {
        "_id": ObjectId(),
        "user_id": str(user_id),
        "action": "earn",
        "points": points,
        "reason": reason,
        "description": description,
        "booking_id": booking_id,
        "balance_after": new_points,
        "created_at": datetime.now(timezone.utc),
    }
    await db.loyalty_history.insert_one(history_doc)

    # Check and award badges
    await _check_and_award_badges(db, user_id, new_points, new_tier)

    # Send notification
    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, user_id,
            f"🎉 You earned {points} loyalty points!",
            description,
            "loyalty",
        )
    except Exception:
        pass

    return {"points_added": points, "new_balance": new_points, "tier": new_tier}


async def award_booking_points(
    db: AsyncIOMotorDatabase, user_id: str, booking_id: str, amount: float
) -> dict:
    """Award 1 point per ₹10 spent on a completed booking."""
    points = max(1, int(amount / 10))
    # Increment bookings_completed counter
    await db.loyalty_accounts.update_one(
        {"user_id": str(user_id)},
        {"$inc": {"bookings_completed": 1}},
        upsert=False,
    )
    return await _add_points(
        db, user_id, points,
        reason="booking",
        description=f"Earned {points} points for completing a booking worth ₹{amount:.0f}",
        booking_id=booking_id,
    )


async def award_review_points(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Award 50 points for leaving a review."""
    await db.loyalty_accounts.update_one(
        {"user_id": str(user_id)},
        {"$inc": {"reviews_count": 1}},
        upsert=False,
    )
    return await _add_points(
        db, user_id, 50,
        reason="review",
        description="Earned 50 points for submitting a review",
    )


async def award_referral_points(db: AsyncIOMotorDatabase, referrer_id: str) -> dict:
    """Award 100 points to the referrer when their friend joins."""
    await db.loyalty_accounts.update_one(
        {"user_id": str(referrer_id)},
        {"$inc": {"referrals_count": 1}},
        upsert=False,
    )
    return await _add_points(
        db, referrer_id, 100,
        reason="referral",
        description="Earned 100 points for referring a friend who joined OneDW",
    )


async def award_profile_points(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Award 20 points once for completing your profile."""
    account = await get_or_create_loyalty_account(db, user_id)
    if account.get("profile_complete"):
        return {"message": "Profile points already awarded"}

    await db.loyalty_accounts.update_one(
        {"user_id": str(user_id)},
        {"$set": {"profile_complete": True}},
    )
    return await _add_points(
        db, user_id, 20,
        reason="profile",
        description="Earned 20 points for completing your profile",
    )


async def admin_award_points(
    db: AsyncIOMotorDatabase,
    user_id: str,
    points: int,
    reason: str,
    description: str = "",
    admin_id: str = "",
) -> dict:
    """Admin: manually award points to a customer."""
    result = await _add_points(
        db, user_id, points,
        reason="admin_award",
        description=description or reason,
    )
    return result


# ─── Badge Checking ───────────────────────────────────────────────────────────

async def _check_and_award_badges(
    db: AsyncIOMotorDatabase, user_id: str, total_points: int, tier: str
) -> None:
    """Check all badge conditions and award unlocked ones."""
    account = await db.loyalty_accounts.find_one({"user_id": str(user_id)}) or {}
    existing_badges = set(account.get("badges", []))
    bookings_completed = account.get("bookings_completed", 0)
    reviews_count = account.get("reviews_count", 0)
    referrals_count = account.get("referrals_count", 0)
    profile_complete = account.get("profile_complete", False)

    new_badges = []
    for badge in BADGES:
        if badge["id"] in existing_badges:
            continue
        trigger = badge["trigger"]
        earned = False
        if trigger == "bookings_completed" and bookings_completed >= badge.get("threshold", 0):
            earned = True
        elif trigger == "reviews_count" and reviews_count >= badge.get("threshold", 0):
            earned = True
        elif trigger == "referrals_count" and referrals_count >= badge.get("threshold", 0):
            earned = True
        elif trigger == "profile_complete" and profile_complete:
            earned = True
        elif trigger == "tier_reached":
            tier_order_map = {t: i for i, t in enumerate(TIER_ORDER)}
            if tier_order_map.get(tier, 0) >= tier_order_map.get(badge.get("tier", "Bronze"), 0):
                earned = True

        if earned:
            new_badges.append(badge["id"])

    if new_badges:
        await db.loyalty_accounts.update_one(
            {"user_id": str(user_id)},
            {"$addToSet": {"badges": {"$each": new_badges}}},
        )
        # Log badge award history
        for badge_id in new_badges:
            badge_info = next((b for b in BADGES if b["id"] == badge_id), {})
            history_doc = {
                "_id": ObjectId(),
                "user_id": str(user_id),
                "action": "badge",
                "points": 0,
                "reason": "badge_earned",
                "description": f"🏅 Badge Unlocked: {badge_info.get('name', badge_id)} — {badge_info.get('description', '')}",
                "badge_id": badge_id,
                "created_at": datetime.now(timezone.utc),
            }
            await db.loyalty_history.insert_one(history_doc)
        # Notify
        try:
            from app.services.notification_service import create_notification
            for badge_id in new_badges:
                badge_info = next((b for b in BADGES if b["id"] == badge_id), {})
                await create_notification(
                    db, user_id,
                    f"{badge_info.get('icon', '🏅')} Badge Unlocked: {badge_info.get('name', badge_id)}",
                    badge_info.get("description", ""),
                    "loyalty",
                )
        except Exception:
            pass


# ─── Redemption ───────────────────────────────────────────────────────────────

async def redeem_points(
    db: AsyncIOMotorDatabase, user_id: str, reward_id: str, quantity: int = 1
) -> dict:
    """Redeem points for a reward (wallet credit or discount coupon)."""
    reward = next((r for r in REWARDS if r["id"] == reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found.")

    account = await get_or_create_loyalty_account(db, user_id)
    total_cost = reward["points_required"] * quantity

    if account["points"] < total_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient points. You have {account['points']} pts, need {total_cost} pts.",
        )

    new_balance = account["points"] - total_cost
    new_tier = _calculate_tier(new_balance)

    await db.loyalty_accounts.update_one(
        {"user_id": str(user_id)},
        {"$set": {
            "points": new_balance,
            "tier": new_tier,
            "updated_at": datetime.now(timezone.utc),
        }, "$inc": {"total_redeemed": total_cost}},
    )

    # Apply the reward
    coupon_code = None
    if reward["reward_type"] == "wallet_credit":
        wallet_amount = reward["reward_value"] * quantity
        try:
            await db.wallets.update_one(
                {"user_id": str(user_id)},
                {"$inc": {"balance": wallet_amount}},
                upsert=True,
            )
            # Wallet history
            await db.wallet_transactions.insert_one({
                "_id": ObjectId(),
                "user_id": str(user_id),
                "type": "credit",
                "amount": wallet_amount,
                "description": f"Loyalty Reward: {reward['name']}",
                "source": "loyalty",
                "created_at": datetime.now(timezone.utc),
            })
        except Exception:
            pass
    elif reward["reward_type"] == "discount_coupon":
        coupon_code = "ODW-" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        await db.coupons.insert_one({
            "_id": ObjectId(),
            "code": coupon_code,
            "user_id": str(user_id),
            "discount_percent": reward["reward_value"],
            "source": "loyalty",
            "reward_id": reward_id,
            "is_used": False,
            "created_at": datetime.now(timezone.utc),
        })

    # Log history
    await db.loyalty_history.insert_one({
        "_id": ObjectId(),
        "user_id": str(user_id),
        "action": "redeem",
        "points": -total_cost,
        "reason": "redemption",
        "description": f"Redeemed {total_cost} points for {reward['name']}",
        "reward_id": reward_id,
        "coupon_code": coupon_code,
        "balance_after": new_balance,
        "created_at": datetime.now(timezone.utc),
    })

    # Notify
    try:
        from app.services.notification_service import create_notification
        await create_notification(
            db, user_id,
            f"🎁 Reward Redeemed: {reward['name']}",
            f"You redeemed {total_cost} points. New balance: {new_balance} pts.",
            "loyalty",
        )
    except Exception:
        pass

    return {
        "success": True,
        "reward": reward,
        "points_spent": total_cost,
        "new_balance": new_balance,
        "tier": new_tier,
        "coupon_code": coupon_code,
        "wallet_credit": reward["reward_value"] * quantity if reward["reward_type"] == "wallet_credit" else None,
    }


# ─── Admin Management ─────────────────────────────────────────────────────────

async def get_all_loyalty_accounts(db: AsyncIOMotorDatabase, skip: int = 0, limit: int = 50) -> list[dict]:
    """Admin: list all loyalty accounts."""
    cursor = db.loyalty_accounts.find({}).sort("points", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize_account(d) for d in docs]


async def get_tier_distribution(db: AsyncIOMotorDatabase) -> list[dict]:
    """Admin: tier distribution pie chart data."""
    pipeline = [
        {"$group": {"_id": "$tier", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = await db.loyalty_accounts.aggregate(pipeline).to_list(length=None)
    return [{"tier": r["_id"] or "Bronze", "count": r["count"]} for r in result]


# ─── Referral Lookup ──────────────────────────────────────────────────────────

async def process_referral(db: AsyncIOMotorDatabase, referral_code: str, new_user_id: str) -> dict:
    """When a new user registers with a referral code, award the referrer points."""
    referrer_account = await db.loyalty_accounts.find_one({"referral_code": referral_code})
    if not referrer_account:
        return {"success": False, "message": "Referral code not found"}

    referrer_id = referrer_account["user_id"]
    if referrer_id == str(new_user_id):
        return {"success": False, "message": "Cannot refer yourself"}

    await award_referral_points(db, referrer_id)
    return {"success": True, "referrer_id": referrer_id}
