# app/models/base.py

from pydantic import ConfigDict
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy import event


def utcnow() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class BaseTable(SQLModel):
    """Base model with shared fields for all database tables."""
    id: Optional[int] = Field(default=None, primary_key=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class BaseRead(SQLModel):
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat() if v else None},
    )


@event.listens_for(BaseTable, "before_insert", propagate=True)
def auto_set_created_timestamp(mapper, connection, target):
    now = utcnow()
    if not target.created_at:
        target.created_at = now
    if not target.updated_at:
        target.updated_at = now


@event.listens_for(BaseTable, "before_update", propagate=True)
def auto_update_timestamp(mapper, connection, target):
    target.updated_at = utcnow()
