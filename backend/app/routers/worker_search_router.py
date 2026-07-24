"""
Worker search and discovery endpoints.
Public endpoints — no auth required for browsing workers.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.worker_search_schema import WorkerSearchFilters, WorkerPublicProfile
from app.services import worker_search_service
from app.database.connection import get_database

router = APIRouter(prefix="/api/workers", tags=["Worker Search"])


@router.get("", response_model=list[WorkerPublicProfile])
async def list_all_workers(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Return all workers with complete profiles."""
    return await worker_search_service.get_all_workers(db)


@router.get("/search", response_model=list[WorkerPublicProfile])
async def search_workers(
    service: Optional[str] = Query(None),
    query: Optional[str] = Query(None, description="Text search by name, location, or skill"),
    location: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_price: Optional[float] = Query(None),
    availability: Optional[str] = Query(None),
    is_available: Optional[bool] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Search workers with multiple filters and optional text query."""
    filters = WorkerSearchFilters(
        service=service, query=query, location=location,
        min_experience=min_experience, min_rating=min_rating,
        max_price=max_price, min_price=min_price,
        availability=availability, is_available=is_available,
        lat=lat, lon=lon, radius_km=radius_km,
    )
    return await worker_search_service.search_workers(db, filters)



@router.get("/{worker_id}")
async def get_worker_profile(worker_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get full public profile of a specific worker."""
    return await worker_search_service.get_worker_by_id(db, worker_id)
