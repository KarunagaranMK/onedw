"""
Worker endpoints: profile management, location, job listing.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.worker_schema import WorkerProfileUpdateSchema, WorkerLocationSchema, WorkerProfileResponseSchema
from app.services import worker_service
from app.database.connection import get_database
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/worker", tags=["Worker"])


@router.get("/profile", response_model=WorkerProfileResponseSchema)
async def get_profile(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.get_worker_profile(db, current_user["_id"])


@router.post("/profile", response_model=WorkerProfileResponseSchema)
async def create_profile(payload: WorkerProfileUpdateSchema, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.update_worker_profile(db, current_user["_id"], payload)


@router.put("/profile", response_model=WorkerProfileResponseSchema)
async def update_profile(payload: WorkerProfileUpdateSchema, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.update_worker_profile(db, current_user["_id"], payload)


@router.post("/location")
async def update_location(payload: WorkerLocationSchema, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.update_worker_location(db, current_user["_id"], payload)


@router.put("/status")
async def update_status(status: str = Query(..., regex="^(online|offline)$"), current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.update_worker_status(db, current_user["_id"], status)


@router.get("/available-jobs")
async def get_available_jobs(service_type: Optional[str] = None, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.get_available_jobs(db, current_user["_id"], service_type)


@router.get("/nearby")
async def get_nearby_workers(service_type: str, customer_lat: float, customer_lon: float, radius_km: float = 200, db: AsyncIOMotorDatabase = Depends(get_database)):
    return await worker_service.get_nearby_workers(db, service_type, customer_lat, customer_lon, radius_km)
