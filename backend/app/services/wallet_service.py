"""
Complete Wallet business logic.
MongoDB collections used:
  - wallets             : one doc per user
  - wallet_transactions : every credit/debit
  - reward_points       : points ledger
  - referrals           : referral usage records
  - cashbacks           : cashback history
  - coupons             : coupon definitions
  - promo_codes         : (alias for coupons)
  - promo_code_usages   : usage tracking
"""
import random
import string
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta

from app.schemas.wallet_schema import (
    AddMoneySchema, WalletPaySchema, RefundSchema,
    PromoSchema, ReferralSchema, RedeemPointsSchema,
    WithdrawalSchema, AdminWalletCreditSchema,
)

POINTS_PER_RUPEE_SPENT = 0.1       # 1 point per ₹10 spent
POINT_VALUE_IN_RUPEES   = 0.10     # 1 point = ₹0.10
CASHBACK_PERCENT        = 0.05     # 5% cashback on bookings
REFERRAL_BONUS          = 100.0    # ₹100 per referral


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_wallet(doc: dict) -> dict:
    out = dict(doc)
    out.pop("_id", None)
    return out


def _serialize_tx(doc: dict) -> dict:
    out = dict(doc)
    out["id"] = str(out.pop("_id", ""))
    return out


def _gen_referral_code(user_id: str) -> str:
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"ODW{suffix}"


async def _get_or_create_wallet(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        now = datetime.now(timezone.utc)
        referral_code = _gen_referral_code(user_id)
        new_wallet = {
            "user_id": user_id,
            "balance": 0.0,
            "total_spent": 0.0,
            "total_cashback": 0.0,
            "reward_points": 0,
            "pending_refunds": 0.0,
            "total_earned": 0.0,
            "pending_withdrawal": 0.0,
            "total_withdrawn": 0.0,
            "referral_code": referral_code,
            "created_at": now,
            "updated_at": now,
        }
        await db.wallets.insert_one(new_wallet)
        # Seed referrals doc
        await db.referrals.update_one(
            {"referral_code": referral_code},
            {"$setOnInsert": {"referral_code": referral_code, "owner_user_id": user_id, "uses": 0, "created_at": now}},
            upsert=True,
        )
        wallet = await db.wallets.find_one({"user_id": user_id})
    return wallet


async def _record_tx(db, user_id: str, tx_type: str, amount: float,
                      ref: str = "", desc: str = "", status: str = "completed"):
    await db.wallet_transactions.insert_one({
        "user_id": user_id, "type": tx_type,
        "amount": amount, "reference_id": ref,
        "description": desc, "status": status,
        "created_at": datetime.now(timezone.utc),
    })


# ─── Customer Wallet ──────────────────────────────────────────────────────────

async def get_wallet(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    wallet = await _get_or_create_wallet(db, user_id)
    return _serialize_wallet(wallet)


async def add_money(db: AsyncIOMotorDatabase, user_id: str, payload: AddMoneySchema) -> dict:
    amount = round(payload.amount, 2)
    now = datetime.now(timezone.utc)
    await db.wallets.update_one(
        {"user_id": user_id},
        {
            "$inc": {"balance": amount},
            "$set": {"updated_at": now},
            "$setOnInsert": {
                "total_spent": 0.0, "total_cashback": 0.0,
                "reward_points": 0, "pending_refunds": 0.0,
                "total_earned": 0.0, "pending_withdrawal": 0.0, "total_withdrawn": 0.0,
                "referral_code": _gen_referral_code(user_id), "created_at": now,
            },
        },
        upsert=True,
    )
    await _record_tx(db, user_id, "RECHARGE", amount,
                     ref=payload.gateway_reference or "",
                     desc=f"Wallet recharge via {payload.payment_method.upper()}")
    return await get_wallet(db, user_id)


async def wallet_pay(db: AsyncIOMotorDatabase, user_id: str, payload: WalletPaySchema) -> dict:
    amount = round(payload.amount, 2)
    wallet = await _get_or_create_wallet(db, user_id)
    if wallet.get("balance", 0) < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Available: ₹{wallet.get('balance', 0):.2f}",
        )
    now = datetime.now(timezone.utc)
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": -amount, "total_spent": amount}, "$set": {"updated_at": now}},
    )
    await _record_tx(db, user_id, "BOOKING_PAYMENT", -amount,
                     ref=payload.booking_id,
                     desc=f"Payment for booking #{payload.booking_id[:8]}")

    # Reward points: 1 pt per ₹10
    points = int(amount // 10)
    if points > 0:
        await db.wallets.update_one({"user_id": user_id}, {"$inc": {"reward_points": points}})
        await db.reward_points.update_one(
            {"user_id": user_id},
            {"$inc": {"total_earned": points, "current_balance": points},
             "$set": {"updated_at": now},
             "$setOnInsert": {"total_redeemed": 0, "created_at": now}},
            upsert=True,
        )

    # 5% cashback
    cashback = round(amount * CASHBACK_PERCENT, 2)
    if cashback > 0:
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": cashback, "total_cashback": cashback}},
        )
        await _record_tx(db, user_id, "CASHBACK", cashback,
                         ref=payload.booking_id,
                         desc=f"5% cashback on booking #{payload.booking_id[:8]}")
        await db.cashbacks.insert_one({
            "user_id": user_id, "amount": cashback,
            "booking_id": payload.booking_id,
            "created_at": now,
        })

    return await get_wallet(db, user_id)


async def process_refund(db: AsyncIOMotorDatabase, user_id: str, payload: RefundSchema) -> dict:
    amount = round(payload.amount, 2)
    now = datetime.now(timezone.utc)
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": amount}, "$set": {"updated_at": now}},
        upsert=True,
    )
    await _record_tx(db, user_id, "REFUND", amount,
                     ref=payload.booking_id,
                     desc=payload.reason or f"Refund for booking #{payload.booking_id[:8]}")
    return await get_wallet(db, user_id)


async def get_wallet_history(db: AsyncIOMotorDatabase, user_id: str,
                              tx_type: str = None, skip: int = 0, limit: int = 30) -> list:
    query = {"user_id": user_id}
    if tx_type:
        query["type"] = tx_type
    cursor = db.wallet_transactions.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=None)
    return [_serialize_tx(d) for d in docs]


# ─── Promo / Coupon ───────────────────────────────────────────────────────────

BUILT_IN_PROMOS = {
    "WELCOME10": {"discount_type": "percent", "discount_value": 10, "max_discount": 100},
    "ONEDW20":   {"discount_type": "percent", "discount_value": 20, "max_discount": 200},
    "SAVE50":    {"discount_type": "flat",    "discount_value": 50, "max_discount": 50},
    "FIRST100":  {"discount_type": "flat",    "discount_value": 100, "max_discount": 100},
    "REFER25":   {"discount_type": "percent", "discount_value": 25, "max_discount": 150},
}


async def apply_promo(db: AsyncIOMotorDatabase, user_id: str, payload: PromoSchema) -> dict:
    code = payload.code.upper().strip()

    # ── Check built-in promos first ──
    promo_data = BUILT_IN_PROMOS.get(code)

    # ── Then check DB coupons ──
    db_promo = await db.coupons.find_one({"code": code, "is_active": True})

    if not promo_data and not db_promo:
        return {"code": code, "discount_type": "", "discount_value": 0,
                "max_discount": None, "valid": False, "message": "Invalid or expired promo code."}

    # ── Check if user already used this code ──
    usage = await db.promo_code_usages.count_documents({"code": code, "user_id": user_id})
    if usage >= 1:
        return {"code": code, "discount_type": "", "discount_value": 0,
                "max_discount": None, "valid": False,
                "message": "You have already used this promo code."}

    # Use whichever promo data is available (DB takes priority)
    p = db_promo if db_promo else promo_data

    booking_amount = payload.booking_amount or 500
    if p["discount_type"] == "percent":
        discount = min(booking_amount * p["discount_value"] / 100, p.get("max_discount") or float("inf"))
    else:
        discount = p["discount_value"]
    discount = round(discount, 2)

    now = datetime.now(timezone.utc)
    try:
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": discount, "total_cashback": discount}, "$set": {"updated_at": now}},
            upsert=True,
        )
        await _record_tx(db, user_id, "COUPON", discount, ref=code,
                         desc=f"Cashback from promo code {code}")
        await db.promo_code_usages.insert_one({"code": code, "user_id": user_id, "used_at": now})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to apply promo: {exc}")

    return {
        "code": code, "discount_type": p["discount_type"],
        "discount_value": p["discount_value"], "max_discount": p.get("max_discount"),
        "valid": True, "message": f"🎉 ₹{discount:.2f} cashback added to your wallet!",
    }


# ─── Referral ─────────────────────────────────────────────────────────────────

async def apply_referral(db: AsyncIOMotorDatabase, user_id: str, payload: ReferralSchema) -> dict:
    code = payload.referral_code.upper().strip()

    # Check if user already applied a referral
    already = await db.referrals.find_one({"referred_user_id": user_id})
    if already:
        return {"valid": False, "message": "You have already used a referral code.", "bonus_amount": 0}

    ref_doc = await db.referrals.find_one({"referral_code": code})
    if not ref_doc:
        return {"valid": False, "message": "Invalid referral code.", "bonus_amount": 0}

    owner_id = ref_doc.get("owner_user_id")
    if owner_id == user_id:
        return {"valid": False, "message": "You cannot use your own referral code.", "bonus_amount": 0}

    now = datetime.now(timezone.utc)
    bonus = REFERRAL_BONUS

    try:
        # Credit the new user
        await db.wallets.update_one(
            {"user_id": user_id},
            {"$inc": {"balance": bonus}, "$set": {"updated_at": now}},
            upsert=True,
        )
        await _record_tx(db, user_id, "REFERRAL", bonus, ref=code,
                         desc=f"Referral bonus — used code {code}")

        # Credit the referrer (owner) — create wallet if missing
        if owner_id:
            await db.wallets.update_one(
                {"user_id": owner_id},
                {"$inc": {"balance": bonus}, "$set": {"updated_at": now}},
                upsert=True,
            )
            await _record_tx(db, owner_id, "REFERRAL", bonus, ref=code,
                             desc=f"Referral bonus — {user_id[:8]} used your code")

        # Record referral usage
        await db.referrals.update_one({"referral_code": code}, {"$inc": {"uses": 1}})
        await db.referrals.insert_one({
            "referral_code": code,
            "referred_user_id": user_id,
            "owner_user_id": owner_id,
            "bonus": bonus,
            "used_at": now,
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Referral processing failed: {exc}")

    return {"valid": True, "message": f"🎉 ₹{bonus:.0f} referral bonus added to your wallet!", "bonus_amount": bonus}


async def get_referral_info(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    wallet = await _get_or_create_wallet(db, user_id)
    code = wallet.get("referral_code", "")
    referrals_count = await db.referrals.count_documents({"owner_user_id": user_id, "referred_user_id": {"$exists": True}})
    total_earned = referrals_count * REFERRAL_BONUS
    return {
        "referral_code": code,
        "total_referrals": referrals_count,
        "total_earned": total_earned,
        "bonus_per_referral": REFERRAL_BONUS,
        "share_url": f"https://onedw.app/register?ref={code}",
    }


# ─── Reward Points ────────────────────────────────────────────────────────────

async def get_reward_points(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    wallet = await _get_or_create_wallet(db, user_id)
    pts_doc = await db.reward_points.find_one({"user_id": user_id}) or {}
    points = wallet.get("reward_points", 0)
    return {
        "user_id": user_id,
        "total_earned": pts_doc.get("total_earned", points),
        "total_redeemed": pts_doc.get("total_redeemed", 0),
        "current_balance": points,
        "rupee_value": round(points * POINT_VALUE_IN_RUPEES, 2),
    }


async def redeem_points(db: AsyncIOMotorDatabase, user_id: str, payload: RedeemPointsSchema) -> dict:
    wallet = await _get_or_create_wallet(db, user_id)
    current_pts = wallet.get("reward_points", 0)
    if payload.points > current_pts:
        raise HTTPException(status_code=400, detail=f"Insufficient points. Available: {current_pts}")

    rupee_value = round(payload.points * POINT_VALUE_IN_RUPEES, 2)
    now = datetime.now(timezone.utc)
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": rupee_value, "reward_points": -payload.points}, "$set": {"updated_at": now}},
    )
    await db.reward_points.update_one(
        {"user_id": user_id},
        {"$inc": {"total_redeemed": payload.points, "current_balance": -payload.points},
         "$set": {"updated_at": now}},
        upsert=True,
    )
    await _record_tx(db, user_id, "REWARD_REDEEM", rupee_value,
                     desc=f"Redeemed {payload.points} reward points = ₹{rupee_value}")
    return await get_wallet(db, user_id)


# ─── Worker Wallet ────────────────────────────────────────────────────────────

async def credit_worker_earning(db: AsyncIOMotorDatabase, worker_user_id: str,
                                 amount: float, booking_id: str) -> dict:
    """Credit a worker's pending earnings after a job completion."""
    amount = round(amount, 2)
    now = datetime.now(timezone.utc)
    await db.wallets.update_one(
        {"user_id": worker_user_id},
        {
            "$inc": {"total_earned": amount, "pending_withdrawal": amount, "balance": amount},
            "$set": {"updated_at": now},
            "$setOnInsert": {
                "balance": amount, "total_spent": 0.0, "total_cashback": 0.0,
                "reward_points": 0, "pending_refunds": 0.0, "total_withdrawn": 0.0,
                "referral_code": _gen_referral_code(worker_user_id), "created_at": now,
            },
        },
        upsert=True,
    )
    await _record_tx(db, worker_user_id, "BONUS", amount,
                     ref=booking_id, desc=f"Earnings for job #{booking_id[:8]}")
    return await get_wallet(db, worker_user_id)


async def request_withdrawal(db: AsyncIOMotorDatabase, user_id: str, payload: WithdrawalSchema) -> dict:
    wallet = await _get_or_create_wallet(db, user_id)
    pending = wallet.get("pending_withdrawal", 0)
    amount = round(payload.amount, 2)

    if amount > pending:
        raise HTTPException(status_code=400, detail=f"Insufficient pending earnings. Available: ₹{pending:.2f}")

    now = datetime.now(timezone.utc)
    ref_id = f"WD{int(now.timestamp())}{user_id[:4].upper()}"
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"pending_withdrawal": -amount, "total_withdrawn": amount, "balance": -amount},
         "$set": {"updated_at": now}},
    )
    await _record_tx(db, user_id, "WITHDRAWAL", -amount, ref=ref_id,
                     desc=f"Withdrawal via {payload.method.upper()} — {payload.upi_id or payload.bank_account or ''}")

    return {"status": "processing", "message": f"Withdrawal of ₹{amount:.2f} is being processed.", "amount": amount, "reference_id": ref_id}


# ─── Analytics ────────────────────────────────────────────────────────────────

async def get_wallet_analytics(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    wallet = await _get_or_create_wallet(db, user_id)

    # Monthly spending — last 6 months
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    pipeline = [
        {"$match": {"user_id": user_id, "created_at": {"$gte": six_months_ago}, "amount": {"$lt": 0}}},
        {"$group": {
            "_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}},
            "total": {"$sum": {"$abs": "$amount"}},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]
    monthly = await db.wallet_transactions.aggregate(pipeline).to_list(length=None)

    # Breakdown by type
    breakdown_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$type", "total": {"$sum": {"$abs": "$amount"}}, "count": {"$sum": 1}}},
    ]
    breakdown = await db.wallet_transactions.aggregate(breakdown_pipeline).to_list(length=None)

    # Calculate totals from transactions
    refund_total = await db.wallet_transactions.aggregate([
        {"$match": {"user_id": user_id, "type": "REFUND"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(length=None)
    recharge_total = await db.wallet_transactions.aggregate([
        {"$match": {"user_id": user_id, "type": "RECHARGE"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(length=None)

    return {
        "total_balance": wallet.get("balance", 0),
        "total_spent": wallet.get("total_spent", 0),
        "total_cashback": wallet.get("total_cashback", 0),
        "total_recharges": recharge_total[0]["total"] if recharge_total else 0,
        "total_refunds": refund_total[0]["total"] if refund_total else 0,
        "reward_points": wallet.get("reward_points", 0),
        "monthly_spending": [
            {"month": f"{m['_id']['year']}-{m['_id']['month']:02d}", "amount": round(m["total"], 2)}
            for m in monthly
        ],
        "transaction_breakdown": [
            {"type": b["_id"], "total": round(b["total"], 2), "count": b["count"]}
            for b in breakdown
        ],
    }


# ─── Admin ────────────────────────────────────────────────────────────────────

async def admin_credit_wallet(db: AsyncIOMotorDatabase, payload: AdminWalletCreditSchema) -> dict:
    amount = round(payload.amount, 2)
    now = datetime.now(timezone.utc)
    await db.wallets.update_one(
        {"user_id": payload.user_id},
        {
            "$inc": {"balance": amount, **({"total_cashback": amount} if payload.credit_type == "CASHBACK" else {})},
            "$set": {"updated_at": now},
            "$setOnInsert": {"total_spent": 0.0, "total_cashback": 0.0, "reward_points": 0, "pending_refunds": 0.0, "created_at": now},
        },
        upsert=True,
    )
    await _record_tx(db, payload.user_id, payload.credit_type, amount,
                     desc=payload.reason or f"Admin credit of ₹{amount}")
    return await get_wallet(db, payload.user_id)


async def get_admin_wallet_stats(db: AsyncIOMotorDatabase) -> dict:
    total_wallets = await db.wallets.count_documents({})
    pipeline_balance = [{"$group": {"_id": None, "total": {"$sum": "$balance"}}}]
    pipeline_refund  = [{"$match": {"type": "REFUND"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    pipeline_cashback = [{"$match": {"type": {"$in": ["CASHBACK", "COUPON"]}}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    pipeline_revenue = [{"$match": {"type": "BOOKING_PAYMENT"}}, {"$group": {"_id": None, "total": {"$sum": {"$abs": "$amount"}}}}]
    pipeline_pending_wd = [{"$group": {"_id": None, "total": {"$sum": "$pending_withdrawal"}}}]

    # Monthly revenue (last 6 months)
    six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
    pipeline_monthly = [
        {"$match": {"type": "BOOKING_PAYMENT", "created_at": {"$gte": six_months_ago}}},
        {"$group": {"_id": {"year": {"$year": "$created_at"}, "month": {"$month": "$created_at"}}, "total": {"$sum": {"$abs": "$amount"}}}},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]

    # Top users by spending
    pipeline_top = [
        {"$sort": {"total_spent": -1}},
        {"$limit": 5},
        {"$project": {"user_id": 1, "balance": 1, "total_spent": 1, "reward_points": 1}},
    ]

    balance_r   = await db.wallets.aggregate(pipeline_balance).to_list(None)
    refund_r    = await db.wallet_transactions.aggregate(pipeline_refund).to_list(None)
    cashback_r  = await db.wallet_transactions.aggregate(pipeline_cashback).to_list(None)
    revenue_r   = await db.wallet_transactions.aggregate(pipeline_revenue).to_list(None)
    pending_r   = await db.wallets.aggregate(pipeline_pending_wd).to_list(None)
    monthly_r   = await db.wallet_transactions.aggregate(pipeline_monthly).to_list(None)
    top_r       = await db.wallets.aggregate(pipeline_top).to_list(None)
    total_txs   = await db.wallet_transactions.count_documents({})

    return {
        "total_wallet_balance": balance_r[0]["total"] if balance_r else 0,
        "total_transactions": total_txs,
        "total_revenue": revenue_r[0]["total"] if revenue_r else 0,
        "total_refunds_issued": refund_r[0]["total"] if refund_r else 0,
        "total_cashbacks_given": cashback_r[0]["total"] if cashback_r else 0,
        "active_wallets": total_wallets,
        "pending_withdrawals": pending_r[0]["total"] if pending_r else 0,
        "monthly_revenue": [
            {"month": f"{m['_id']['year']}-{m['_id']['month']:02d}", "amount": round(m["total"], 2)}
            for m in monthly_r
        ],
        "top_users": [
            {"user_id": u["user_id"], "balance": u["balance"], "total_spent": u["total_spent"], "reward_points": u["reward_points"]}
            for u in top_r
        ],
    }
