"""
Pydantic schemas for the Customer Loyalty Program (Phase 18).
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LoyaltyAccountResponse(BaseModel):
    user_id: str
    points: int
    tier: str
    total_earned: int
    total_redeemed: int
    badges: list[str]
    referral_code: str
    created_at: Optional[datetime] = None


class PointsHistoryItem(BaseModel):
    id: str
    user_id: str
    action: str          # earn | redeem
    points: int
    reason: str          # booking | review | referral | profile | redemption
    description: str
    booking_id: Optional[str] = None
    created_at: Optional[datetime] = None


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None


class RewardItem(BaseModel):
    id: str
    name: str
    description: str
    points_required: int
    reward_type: str     # wallet_credit | discount_coupon | cashback
    reward_value: float  # INR amount or discount %
    icon: str
    is_active: bool = True


class RedeemRequest(BaseModel):
    reward_id: str
    quantity: int = 1


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    points: int
    tier: str
    badges_count: int


class AdminAwardPointsRequest(BaseModel):
    user_id: str
    points: int
    reason: str
    description: str = ""
