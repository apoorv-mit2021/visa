# app/models/support_case.py

from __future__ import annotations

from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseTableMixin
from app.utils.common import utcnow

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.order import Order


# -----------------------------------------------------
# CASE STATUS ENUM
# -----------------------------------------------------
class CaseStatus:
    OPEN = "open"
    CLOSED = "closed"
    IN_PROGRESS = "in_progress"


# -----------------------------------------------------
# SUPPORT CASE MODEL
# -----------------------------------------------------
class SupportCase(Base, BaseTableMixin):
    __tablename__ = "support_cases"

    user_id = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    order_id = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)

    assigned_to_id = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    subject = mapped_column(String(255), nullable=False)
    description = mapped_column(String(2000), nullable=True)
    status = mapped_column(String(50), default=CaseStatus.OPEN, nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="cases_raised",
        lazy="selectin",
        foreign_keys=[user_id],
    )

    assigned_to: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="cases_assigned",
        lazy="selectin",
        foreign_keys=[assigned_to_id],
    )

    order: Mapped[Optional["Order"]] = relationship(
        "Order",
        lazy="selectin"
    )

    # Case messages (cascade delete)
    messages: Mapped[List["CaseMessage"]] = relationship(
        "CaseMessage",
        back_populates="case",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


# -----------------------------------------------------
# CASE MESSAGE MODEL
# -----------------------------------------------------
class CaseMessage(Base, BaseTableMixin):
    __tablename__ = "case_messages"

    case_id = mapped_column(ForeignKey("support_cases.id"), nullable=False, index=True)
    sender_id = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    message = mapped_column(String(2000), nullable=False)
    created_at = mapped_column(DateTime, default=utcnow, nullable=False)

    case: Mapped["SupportCase"] = relationship(
        "SupportCase",
        back_populates="messages",
        lazy="selectin"
    )

    sender: Mapped["User"] = relationship(
        "User",
        lazy="selectin"
    )
