# app/models/base.py

from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, Integer, Boolean, DateTime, event
from sqlalchemy.orm import declarative_base

from pydantic import BaseModel, ConfigDict

from app.utils.common import utcnow

# -----------------------------------------------------
# SQLALCHEMY BASE
# -----------------------------------------------------
Base = declarative_base()


# -----------------------------------------------------
# SHARED TABLE MIXIN
# -----------------------------------------------------
class BaseTableMixin:
    """Shared columns for all database tables."""

    id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# -----------------------------------------------------
# TIMESTAMP EVENT LISTENERS
# -----------------------------------------------------
@event.listens_for(BaseTableMixin, "before_insert", propagate=True)
def _set_created_timestamp(mapper, connection, target):
    now = utcnow()
    if not target.created_at:
        target.created_at = now
    if not target.updated_at:
        target.updated_at = now


@event.listens_for(BaseTableMixin, "before_update", propagate=True)
def _set_updated_timestamp(mapper, connection, target):
    target.updated_at = utcnow()


# -----------------------------------------------------
# BASE READ SCHEMA (Pydantic)
# -----------------------------------------------------
class BaseRead(BaseModel):
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat() if v else None},
    )
