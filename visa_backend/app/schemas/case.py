# app/schemas/support_case.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.models.base import BaseRead


# -----------------------------------------------------
# CASE MESSAGE SCHEMAS
# -----------------------------------------------------
class CaseMessageCreate(BaseModel):
    message: str


class CaseMessageRead(BaseRead):
    id: int
    sender_id: int
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------
# SUPPORT CASE SCHEMAS
# -----------------------------------------------------
class SupportCaseCreate(BaseModel):
    subject: str
    description: Optional[str] = None
    order_id: Optional[int] = None


class SupportCaseUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None


class SupportCaseRead(BaseRead):
    id: int
    user_id: int
    order_id: Optional[int]
    assigned_to_id: Optional[int]
    subject: str
    description: Optional[str]
    status: str
    messages: List[CaseMessageRead] = []

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------
# SUPPORT METRICS SCHEMA
# -----------------------------------------------------
class SupportMetrics(BaseModel):
    total_cases: int
    open_cases: int
    closed_cases: int
    in_progress_cases: int
    cases_last_7_days: int
    avg_response_time_hours: float
