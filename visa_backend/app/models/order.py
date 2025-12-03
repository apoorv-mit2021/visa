from __future__ import annotations

from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseTableMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import Product


class OrderStatus:
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


# -----------------------------------------------------
# ORDER MODEL
# -----------------------------------------------------
class Order(Base, BaseTableMixin):
    __tablename__ = "orders"

    # User is OPTIONAL for guest checkout
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )

    total_amount = mapped_column(Float, default=0.0, nullable=False)
    status = mapped_column(String(50), default=OrderStatus.PENDING, nullable=False, index=True)

    # Address snapshots stored as JSON
    shipping_address = mapped_column(JSON, nullable=False)
    billing_address = mapped_column(JSON, nullable=False)

    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="orders",
        lazy="selectin",
    )

    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


# -----------------------------------------------------
# ORDER ITEM
# -----------------------------------------------------
class OrderItem(Base, BaseTableMixin):
    __tablename__ = "order_items"

    order_id = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    product_id = mapped_column(ForeignKey("products.id"), nullable=False, index=True)

    size = mapped_column(String(20), nullable=False)
    quantity = mapped_column(Integer, nullable=False)
    price = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items",
        lazy="selectin",
    )

    product: Mapped["Product"] = relationship(
        "Product",
        lazy="selectin",
    )
