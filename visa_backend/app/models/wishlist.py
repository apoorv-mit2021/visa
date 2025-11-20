from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead
from .user import User
from .product_variant import ProductVariant


class Wishlist(BaseTable, table=True):
    """User wishlist (favorite products)"""
    __tablename__ = "wishlists"

    user_id: int = Field(foreign_key="users.id", index=True, unique=True)
    user: User = Relationship(back_populates="wishlist")

    items: List["WishlistItem"] = Relationship(
        back_populates="wishlist",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )


class WishlistItem(BaseTable, table=True):
    """Wishlist items (no quantity, variant-based)"""
    __tablename__ = "wishlist_items"

    wishlist_id: int = Field(foreign_key="wishlists.id", index=True)
    variant_id: int = Field(foreign_key="product_variants.id", index=True)

    wishlist: Wishlist = Relationship(back_populates="items")
    variant: ProductVariant = Relationship(sa_relationship_kwargs={"lazy": "selectin"})


# -----------------------------
# Schemas
# -----------------------------
class WishlistItemCreate(SQLModel):
    variant_id: int


class WishlistItemRead(BaseRead):
    id: int
    variant_id: int
    variant: Optional[ProductVariant] = None


class WishlistRead(BaseRead):
    id: int
    user_id: int
    items: Optional[List[WishlistItemRead]] = None
