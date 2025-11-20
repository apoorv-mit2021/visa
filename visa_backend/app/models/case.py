from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .order import Order


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# -----------------------------
# CASE / TICKET MODEL
# -----------------------------

class CaseStatus:
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportCase(BaseTable, table=True):
    """Support or service ticket raised by a user"""
    __tablename__ = "support_cases"

    user_id: int = Field(foreign_key="users.id", index=True)
    order_id: Optional[int] = Field(foreign_key="orders.id", index=True)
    assigned_to_id: Optional[int] = Field(foreign_key="users.id", default=None, index=True)
    subject: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: str = Field(default=CaseStatus.OPEN, index=True)

    # Relationships
    user: "User" = Relationship(
        back_populates="cases_raised",
        sa_relationship_kwargs={"lazy": "selectin", "foreign_keys": "[SupportCase.user_id]"},
    )

    assigned_to: Optional["User"] = Relationship(
        back_populates="cases_assigned",
        sa_relationship_kwargs={"lazy": "selectin", "foreign_keys": "[SupportCase.assigned_to_id]"},
    )

    order: Optional["Order"] = Relationship(sa_relationship_kwargs={"lazy": "selectin"})

    messages: List["CaseMessage"] = Relationship(
        back_populates="case",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )


# -----------------------------
# CASE MESSAGE MODEL
# -----------------------------

class CaseMessage(BaseTable, table=True):
    """Messages exchanged in a case"""
    __tablename__ = "case_messages"

    case_id: int = Field(foreign_key="support_cases.id")
    sender_id: int = Field(foreign_key="users.id")
    message: str = Field(max_length=2000)
    created_at: datetime = Field(default_factory=utcnow)

    case: "SupportCase" = Relationship(back_populates="messages")
    sender: "User" = Relationship(sa_relationship_kwargs={"lazy": "selectin"})


# -----------------------------
# SCHEMAS
# -----------------------------

class CaseMessageCreate(SQLModel):
    message: str


class CaseMessageRead(BaseRead):
    id: int
    sender_id: int
    message: str
    created_at: datetime


class SupportCaseCreate(SQLModel):
    subject: str
    description: Optional[str] = None
    order_id: Optional[int] = None


class SupportCaseUpdate(SQLModel):
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
    messages: Optional[List[CaseMessageRead]] = None
