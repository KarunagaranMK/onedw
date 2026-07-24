from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WorkerSearchFilters(BaseModel):
    service: Optional[str] = None           # profession/service type match
    query: Optional[str] = None             # free-text: name, location, skill
    location: Optional[str] = None
    min_experience: Optional[int] = None
    min_rating: Optional[float] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    availability: Optional[str] = None      # day name e.g. "Monday"
    is_available: Optional[bool] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    radius_km: Optional[float] = 100



class WorkerPublicProfile(BaseModel):
    id: str
    name: str
    email: str = ""
    phone: str = ""
    service_type: str = ""
    skills: List[str] = []
    experience_years: int = 0
    hourly_rate: float = 0.0
    bio: str = ""
    languages: List[str] = []
    availability: List[str] = []
    working_hours: dict = {}
    address: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_photo: str = ""
    average_rating: float = 0.0
    total_jobs: int = 0
    is_available: bool = True
    verified: bool = False
    distance_km: Optional[float] = None
    created_at: Optional[datetime] = None
