# app/models/address.py

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseTableMixin

if TYPE_CHECKING:
    from app.models.user import User


class AddressType:
    SHIPPING = "shipping"
    BILLING = "billing"


class Address(Base, BaseTableMixin):
    __tablename__ = "addresses"

    user_id = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    type = mapped_column(String(20), default=AddressType.SHIPPING, nullable=False)
    full_name = mapped_column(String(255), nullable=False)
    street = mapped_column(String(255), nullable=False)
    apartment = mapped_column(String(100), nullable=True)
    city = mapped_column(String(100), nullable=False)
    state = mapped_column(String(100), nullable=False)
    zip = mapped_column(String(20), nullable=False)
    country = mapped_column(String(100), nullable=False)

    is_default = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="addresses",
        lazy="selectin",
    )
