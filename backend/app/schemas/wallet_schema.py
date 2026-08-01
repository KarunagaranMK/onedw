"""
Complete Wallet system Pydantic schemas.
Collections: wallets, wallet_transactions, reward_points, referrals, cashbacks, coupons
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

TRANSACTION_TYPES = [
    "BOOKING_PAYMENT", "REFUND", "CASHBACK", "BONUS",
    "REFERRAL", "COUPON", "RECHARGE", "ADMIN_CREDIT",
    "ADMIN_DEBIT", "REWARD_REDEEM", "WITHDRAWAL",
]


# ─── Wallet ────────────────────────────────────────────────────────────────────

class WalletResponseSchema(BaseModel):
    user_id: str
    balance: float = 0.0
    total_spent: float = 0.0
    total_cashback: float = 0.0
    reward_points: int = 0
    pending_refunds: float = 0.0
    total_earned: float = 0.0          # worker: total earnings
    pending_withdrawal: float = 0.0   # worker: pending payout
    total_withdrawn: float = 0.0      # worker: total withdrawn
    referral_code: Optional[str] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Transactions ──────────────────────────────────────────────────────────────

class WalletTransactionSchema(BaseModel):
    id: str
    user_id: str
    type: str
    amount: float
    reference_id: Optional[str] = None
    description: Optional[str] = ""
    status: str = "completed"
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─── Add Money ─────────────────────────────────────────────────────────────────

class AddMoneySchema(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to add (must be positive)")
    payment_method: str = "upi"
    gateway_reference: Optional[str] = None


# ─── Pay ───────────────────────────────────────────────────────────────────────

class WalletPaySchema(BaseModel):
    booking_id: str
    amount: float = Field(..., gt=0)


# ─── Refund ────────────────────────────────────────────────────────────────────

class RefundSchema(BaseModel):
    booking_id: str
    amount: float = Field(..., gt=0)
    reason: str = ""


# ─── Promo / Coupon ────────────────────────────────────────────────────────────

class PromoSchema(BaseModel):
    code: str = Field(..., min_length=3, max_length=30)
    booking_amount: Optional[float] = None


class PromoResponseSchema(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    max_discount: Optional[float] = None
    valid: bool
    message: str


# ─── Referral ─────────────────────────────────────────────────────────────────

class ReferralSchema(BaseModel):
    referral_code: str = Field(..., min_length=4)


class ReferralResponseSchema(BaseModel):
    valid: bool
    message: str
    bonus_amount: float = 0.0


# ─── Reward Points ─────────────────────────────────────────────────────────────

class RedeemPointsSchema(BaseModel):
    points: int = Field(..., gt=0)


class RewardPointsSchema(BaseModel):
    user_id: str
    total_earned: int = 0
    total_redeemed: int = 0
    current_balance: int = 0
    rupee_value: float = 0.0


# ─── Worker Withdrawal ─────────────────────────────────────────────────────────

class WithdrawalSchema(BaseModel):
    amount: float = Field(..., gt=0)
    bank_account: Optional[str] = None
    upi_id: Optional[str] = None
    method: str = "upi"   # upi | bank


class WithdrawalResponseSchema(BaseModel):
    status: str
    message: str
    amount: float
    reference_id: str


# ─── Analytics ────────────────────────────────────────────────────────────────

class WalletAnalyticsSchema(BaseModel):
    total_balance: float = 0.0
    total_spent: float = 0.0
    total_cashback: float = 0.0
    total_recharges: float = 0.0
    total_refunds: float = 0.0
    reward_points: int = 0
    monthly_spending: List[dict] = []
    transaction_breakdown: List[dict] = []


# ─── Admin ────────────────────────────────────────────────────────────────────

class AdminWalletCreditSchema(BaseModel):
    user_id: str
    amount: float = Field(..., gt=0)
    reason: str = ""
    credit_type: str = "ADMIN_CREDIT"   # ADMIN_CREDIT | BONUS | CASHBACK


class AdminWalletStatsSchema(BaseModel):
    total_wallet_balance: float = 0.0
    total_transactions: int = 0
    total_revenue: float = 0.0
    total_refunds_issued: float = 0.0
    total_cashbacks_given: float = 0.0
    active_wallets: int = 0
    pending_withdrawals: float = 0.0
    monthly_revenue: List[dict] = []
    top_users: List[dict] = []
