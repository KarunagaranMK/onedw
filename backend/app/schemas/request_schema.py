"""
Pydantic schemas for service requests raised by customers.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
import re


def _normalise_date(v: str) -> str:
    """Accept YYYY-MM-DD or DD-MM-YYYY and always store as YYYY-MM-DD."""
    v = v.strip()
    # Already YYYY-MM-DD
    if re.match(r"^\d{4}-\d{2}-\d{2}$", v):
        return v
    # DD-MM-YYYY  →  YYYY-MM-DD
    m = re.match(r"^(\d{2})-(\d{2})-(\d{4})$", v)
    if m:
        day, month, year = m.groups()
        return f"{year}-{month}-{day}"
    return v  # Pass through and let downstream validation handle it


def _normalise_time(v: str) -> str:
    """Accept HH:MM (24h) or H:MM AM/PM and always store as HH:MM."""
    v = v.strip()
    # Already HH:MM (24h)
    if re.match(r"^\d{2}:\d{2}$", v):
        return v
    # H:MM AM/PM  (e.g. "8:00 PM", "08:00 PM")
    m = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)$", v, re.IGNORECASE)
    if m:
        hour, minute, meridiem = int(m.group(1)), m.group(2), m.group(3).upper()
        if meridiem == "PM" and hour != 12:
            hour += 12
        elif meridiem == "AM" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute}"
    return v


class RequestCreateSchema(BaseModel):
    service_type: str = Field(..., min_length=2, max_length=50)
    location: str = Field(..., min_length=3, max_length=200)
    latitude: float = 12.9236
    longitude: float = 80.1258
    description: str = Field(..., min_length=5, max_length=1000)
    preferred_date: str = Field(..., description="YYYY-MM-DD or DD-MM-YYYY")
    preferred_time: str = Field(..., description="HH:MM or H:MM AM/PM")

    @field_validator("preferred_date", mode="before")
    @classmethod
    def validate_date(cls, v):
        return _normalise_date(str(v))

    @field_validator("preferred_time", mode="before")
    @classmethod
    def validate_time(cls, v):
        return _normalise_time(str(v))


class RequestUpdateSchema(BaseModel):
    """All fields optional — only provided fields are updated."""
    service_type: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    status: Optional[str] = None


class RequestResponseSchema(BaseModel):
    id: str
    service_type: str
    location: str
    latitude: float
    longitude: float
    description: str
    preferred_date: str
    preferred_time: str
    customer_id: str
    status: str
    created_at: datetime