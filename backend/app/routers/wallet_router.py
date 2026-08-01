"""
Complete Wallet REST API endpoints.
All customer routes require JWT. Admin routes require admin role.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.wallet_schema import (
    WalletResponseSchema, WalletTransactionSchema,
    AddMoneySchema, WalletPaySchema, RefundSchema,
    PromoSchema, PromoResponseSchema,
    ReferralSchema, ReferralResponseSchema,
    RedeemPointsSchema, RewardPointsSchema,
    WithdrawalSchema, WithdrawalResponseSchema,
    WalletAnalyticsSchema, AdminWalletCreditSchema, AdminWalletStatsSchema,
)
from app.services import wallet_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


# ─── Customer: Balance ────────────────────────────────────────────────────────

@router.get("", response_model=WalletResponseSchema)
async def get_wallet(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get the authenticated user's wallet balance and summary."""
    return await wallet_service.get_wallet(db, current_user["_id"])


@router.post("/add-money", response_model=WalletResponseSchema)
async def add_money(
    payload: AddMoneySchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Add funds to wallet via payment gateway (mock in dev)."""
    return await wallet_service.add_money(db, current_user["_id"], payload)


@router.post("/pay", response_model=WalletResponseSchema)
async def pay_from_wallet(
    payload: WalletPaySchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Deduct wallet balance for a booking. Returns 400 if insufficient. Auto-awards cashback + points."""
    return await wallet_service.wallet_pay(db, current_user["_id"], payload)


@router.post("/refund", response_model=WalletResponseSchema)
async def refund_to_wallet(
    payload: RefundSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Auto-refund back into wallet on booking cancellation."""
    return await wallet_service.process_refund(db, current_user["_id"], payload)


# ─── Customer: History ────────────────────────────────────────────────────────

@router.get("/history", response_model=list[WalletTransactionSchema])
async def wallet_history(
    tx_type: str = Query(None),
    skip: int = Query(0),
    limit: int = Query(30),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Paginated wallet transaction history with optional type filter."""
    return await wallet_service.get_wallet_history(
        db, current_user["_id"], tx_type=tx_type, skip=skip, limit=limit
    )


# ─── Customer: Promo Codes ────────────────────────────────────────────────────

@router.post("/promo", response_model=PromoResponseSchema)
async def apply_promo(
    payload: PromoSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Validate and apply a promo/cashback code."""
    return await wallet_service.apply_promo(db, current_user["_id"], payload)


# ─── Customer: Referrals ──────────────────────────────────────────────────────

@router.get("/referral", tags=["Referral"])
async def get_referral_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get current user's referral code, share link, and referral earnings."""
    return await wallet_service.get_referral_info(db, current_user["_id"])


@router.post("/referral/apply", response_model=ReferralResponseSchema, tags=["Referral"])
async def apply_referral(
    payload: ReferralSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Apply a friend's referral code. Awards ₹100 to both the referrer and the new user."""
    return await wallet_service.apply_referral(db, current_user["_id"], payload)


# ─── Customer: Reward Points ──────────────────────────────────────────────────

@router.get("/rewards", response_model=RewardPointsSchema, tags=["Rewards"])
async def get_reward_points(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get current reward points balance and rupee equivalent."""
    return await wallet_service.get_reward_points(db, current_user["_id"])


@router.post("/rewards/redeem", response_model=WalletResponseSchema, tags=["Rewards"])
async def redeem_reward_points(
    payload: RedeemPointsSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Redeem reward points as wallet balance (1 pt = ₹0.10)."""
    return await wallet_service.redeem_points(db, current_user["_id"], payload)


# ─── Customer: Analytics ──────────────────────────────────────────────────────

@router.get("/analytics", response_model=WalletAnalyticsSchema, tags=["Analytics"])
async def wallet_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Spending analytics with monthly breakdown and category breakdown."""
    return await wallet_service.get_wallet_analytics(db, current_user["_id"])


# ─── Worker: Withdrawal ───────────────────────────────────────────────────────

@router.post("/withdraw", response_model=WithdrawalResponseSchema, tags=["Worker"])
async def request_withdrawal(
    payload: WithdrawalSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Worker requests payout of pending earnings to bank/UPI."""
    result = await wallet_service.request_withdrawal(db, current_user["_id"], payload)
    return result


@router.post("/worker/credit", response_model=WalletResponseSchema, tags=["Worker"])
async def credit_worker(
    worker_user_id: str,
    amount: float,
    booking_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Internal: credit worker earnings after job completion (called by booking service)."""
    if current_user.get("role") not in ("admin", "worker"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return await wallet_service.credit_worker_earning(db, worker_user_id, amount, booking_id)


# ─── Admin: Wallet Dashboard ──────────────────────────────────────────────────

@router.get("/admin/stats", response_model=AdminWalletStatsSchema, tags=["Admin"])
async def admin_wallet_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: platform-wide wallet stats, revenue, refunds, cashbacks, withdrawals."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await wallet_service.get_admin_wallet_stats(db)


@router.post("/admin/credit", response_model=WalletResponseSchema, tags=["Admin"])
async def admin_credit_wallet(
    payload: AdminWalletCreditSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: manually credit any user's wallet (bonus, cashback, refund)."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await wallet_service.admin_credit_wallet(db, payload)
