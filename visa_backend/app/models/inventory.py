# app/models/inventory.py

from __future__ import annotations
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseTableMixin

if TYPE_CHECKING:
    from app.models.catalog import Product
    from app.models.user import User


class Inventory(Base, BaseTableMixin):
    __tablename__ = "inventory"

    product_id = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    product: Mapped["Product"] = relationship(
        "Product",
        lazy="selectin",
    )

    previous_quantity = mapped_column(Integer, nullable=False, default=0)
    change = mapped_column(Integer, nullable=False, default=0)
    new_quantity = mapped_column(Integer, nullable=False, default=0)

    reason = mapped_column(
        String(100),
        nullable=False,
        doc="admin_update / order_purchase / order_cancel / system_adjust / restock / transfer / damage / audit",
    )

    note = mapped_column(String, nullable=True)

    performed_by_id = mapped_column(ForeignKey("users.id"), nullable=True)
    performed_by: Mapped[Optional["User"]] = relationship(
        "User",
        lazy="selectin",
    )
