# app/models/cart.py

from __future__ import annotations

from typing import List, TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseTableMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import Product


# -----------------------------------------------------
# CART MODEL
# -----------------------------------------------------
class Cart(Base, BaseTableMixin):
    __tablename__ = "carts"

    user_id = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)

    user: Mapped["User"] = relationship("User", back_populates="cart", lazy="selectin")

    items: Mapped[List["CartItem"]] = relationship(
        "CartItem",
        back_populates="cart",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


# -----------------------------------------------------
# CART ITEM MODEL
# -----------------------------------------------------
class CartItem(Base, BaseTableMixin):
    __tablename__ = "cart_items"

    cart_id = mapped_column(ForeignKey("carts.id"), index=True, nullable=False)
    product_id = mapped_column(ForeignKey("products.id"), nullable=False, index=True)

    size = mapped_column(String(20), nullable=False)
    quantity = mapped_column(Integer, nullable=False)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items", lazy="selectin")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")
