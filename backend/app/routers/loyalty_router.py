"""
Loyalty Program API endpoints (Phase 18).
Customer loyalty: points, badges, leaderboard, rewards redemption.
Admin: management and manual point awarding.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services import loyalty_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user
from app.schemas.loyalty_schema import RedeemRequest, AdminAwardPointsRequest

router = APIRouter(prefix="/api/loyalty", tags=["Loyalty"])


def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


# ── Customer Endpoints ────────────────────────────────────────────────────────

@router.get("/my-points")
async def get_my_loyalty(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get the current user's loyalty account — points, tier, badges."""
    return await loyalty_service.get_my_loyalty(db, current_user["_id"])


@router.get("/history")
async def get_points_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get the current user's points earn/redeem history."""
    return await loyalty_service.get_points_history(db, current_user["_id"])


@router.get("/badges")
async def get_all_badges(
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get all available badges (public)."""
    return await loyalty_service.get_all_badges(db)


@router.get("/rewards")
async def get_rewards(
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get the rewards catalog (public)."""
    return await loyalty_service.get_available_rewards(db)


@router.post("/redeem")
async def redeem_reward(
    payload: RedeemRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Redeem loyalty points for a reward (wallet credit or discount coupon)."""
    return await loyalty_service.redeem_points(
        db, current_user["_id"], payload.reward_id, payload.quantity
    )


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Get the top customers leaderboard (public)."""
    return await loyalty_service.get_leaderboard(db, limit=limit)


@router.post("/profile-complete")
async def award_profile_points(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Award one-time profile completion points."""
    return await loyalty_service.award_profile_points(db, current_user["_id"])


# ── Admin Loyalty Management ──────────────────────────────────────────────────

@router.get("/admin/accounts")
async def list_all_loyalty_accounts(
    skip: int = Query(0),
    limit: int = Query(50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: list all loyalty accounts sorted by points."""
    _require_admin(current_user)
    return await loyalty_service.get_all_loyalty_accounts(db, skip=skip, limit=limit)


@router.get("/admin/tier-distribution")
async def tier_distribution(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: tier distribution for pie chart."""
    _require_admin(current_user)
    return await loyalty_service.get_tier_distribution(db)


@router.post("/admin/award")
async def admin_award_points(
    payload: AdminAwardPointsRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Admin: manually award loyalty points to a customer."""
    _require_admin(current_user)
    return await loyalty_service.admin_award_points(
        db,
        user_id=payload.user_id,
        points=payload.points,
        reason=payload.reason,
        description=payload.description,
        admin_id=current_user["_id"],
    )
