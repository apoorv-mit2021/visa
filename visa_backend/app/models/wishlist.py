# app/models/wishlist.py

from __future__ import annotations

from typing import List, TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseTableMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import Product


# -----------------------------------------------------
# WISHLIST MODEL
# -----------------------------------------------------
class Wishlist(Base, BaseTableMixin):
    __tablename__ = "wishlists"

    user_id = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)

    user: Mapped["User"] = relationship("User", back_populates="wishlist", lazy="selectin")

    items: Mapped[List["WishlistItem"]] = relationship(
        "WishlistItem",
        back_populates="wishlist",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


# -----------------------------------------------------
# WISHLIST ITEM MODEL
# -----------------------------------------------------
class WishlistItem(Base, BaseTableMixin):
    __tablename__ = "wishlist_items"

    wishlist_id = mapped_column(ForeignKey("wishlists.id"), index=True, nullable=False)
    product_id = mapped_column(ForeignKey("products.id"), index=True, nullable=False)

    wishlist: Mapped["Wishlist"] = relationship("Wishlist", back_populates="items", lazy="selectin")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")
