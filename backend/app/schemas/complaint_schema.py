"""
Pydantic schemas for the complaint management system.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


COMPLAINT_CATEGORIES = [
    "Worker didn't arrive",
    "Poor work quality",
    "Overcharging",
    "Wrong service",
    "Damage to property",
    "Inappropriate behavior",
    "Safety issue",
    "Payment issue",
    "Fake worker",
    "Fake customer",
    "Refund request",
    "Warranty claim",
    "Other",
]

COMPLAINT_PRIORITIES = ["low", "medium", "high", "critical"]
COMPLAINT_STATUSES = ["open", "under_review", "assigned", "investigating", "resolved", "closed"]


class ComplaintCreateSchema(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=3000)
    category: str
    booking_id: Optional[str] = None
    priority: str = "medium"
    images: List[str] = []
    videos: List[str] = []
    documents: List[str] = []

    model_config = {"json_schema_extra": {"example": {
        "title": "Worker did not arrive on time",
        "description": "The worker was supposed to arrive at 10 AM but never showed up.",
        "category": "Worker didn't arrive",
        "priority": "high",
    }}}


class ComplaintMessageSchema(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    attachments: List[str] = []


class ComplaintStatusUpdateSchema(BaseModel):
    status: str
    note: Optional[str] = None
    assigned_to: Optional[str] = None


class ComplaintResponseSchema(BaseModel):
    id: str
    title: str
    description: str
    category: str = ""
    priority: str = "medium"
    status: str = "open"
    booking_id: Optional[str] = None
    complainant_id: str
    complainant_name: Optional[str] = ""
    complainant_role: Optional[str] = ""
    against_id: Optional[str] = None
    against_name: Optional[str] = ""
    images: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    documents: Optional[List[str]] = []
    assigned_to: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ComplaintMessageResponseSchema(BaseModel):
    id: str
    complaint_id: str
    sender_id: str
    sender_name: Optional[str] = ""
    sender_role: Optional[str] = ""
    message: str
    attachments: Optional[List[str]] = []
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
