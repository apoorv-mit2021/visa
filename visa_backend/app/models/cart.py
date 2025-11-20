from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead
from .user import User
from .product_variant import ProductVariant


# -----------------------------------------------------
# BASE ITEM MODEL
# -----------------------------------------------------
class CartItemBase(SQLModel):
    quantity: int = Field(gt=0, description="Number of items in the cart")


# -----------------------------------------------------
# CART MODEL
# -----------------------------------------------------
class Cart(BaseTable, table=True):
    """User shopping cart"""
    __tablename__ = "carts"

    user_id: int = Field(foreign_key="users.id", index=True, unique=True)
    user: User = Relationship(back_populates="cart")

    items: List["CartItem"] = Relationship(
        back_populates="cart",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )


class CartItem(CartItemBase, BaseTable, table=True):
    """Items in a user cart (variant-level)"""
    __tablename__ = "cart_items"

    cart_id: int = Field(foreign_key="carts.id", index=True)
    variant_id: int = Field(foreign_key="product_variants.id", index=True)

    cart: Cart = Relationship(back_populates="items")
    variant: ProductVariant = Relationship(sa_relationship_kwargs={"lazy": "selectin"})


# -----------------------------------------------------
# SCHEMAS
# -----------------------------------------------------
class CartItemCreate(SQLModel):
    variant_id: int
    quantity: int


class CartItemRead(BaseRead):
    id: int
    variant_id: int
    quantity: int
    variant: Optional[ProductVariant] = None


class CartRead(BaseRead):
    id: int
    user_id: int
    items: Optional[List[CartItemRead]] = None
