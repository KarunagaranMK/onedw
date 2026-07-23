from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WorkingHoursSchema(BaseModel):
    start: str = "09:00"
    end: str = "18:00"


class LocationSchema(BaseModel):
    latitude: float = 12.9236
    longitude: float = 80.1258


class WorkerProfileUpdateSchema(BaseModel):
    phone: Optional[str] = None
    service_type: Optional[str] = None
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = None
    bio: Optional[str] = None
    languages: Optional[List[str]] = None
    availability: Optional[List[str]] = None
    working_hours: Optional[WorkingHoursSchema] = None
    emergency_contact: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_photo: Optional[str] = None
    identity_proof_type: Optional[str] = None
    identity_proof_url: Optional[str] = None
    is_available: Optional[bool] = None
    skills: Optional[List[str]] = None


class WorkerLocationSchema(BaseModel):
    latitude: float
    longitude: float


class WorkerProfileResponseSchema(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: str
    service_type: Optional[str] = None
    skills: List[str] = []
    experience_years: int = 0
    hourly_rate: float = 0.0
    bio: str = ""
    languages: List[str] = []
    availability: List[str] = []
    working_hours: dict = {"start": "09:00", "end": "18:00"}
    emergency_contact: str = ""
    whatsapp_number: str = ""
    address: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_photo: str = ""
    identity_proof_type: str = ""
    identity_proof_url: str = ""
    is_available: bool = True
    average_rating: float = 0.0
    total_jobs: int = 0
    status: str = "offline"
    verified: bool = False
    profile_complete: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
