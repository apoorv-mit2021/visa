from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead
from .user import User
from .product import Product


class OrderStatus:
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(BaseTable, table=True):
    """User order model"""
    __tablename__ = "orders"

    user_id: int = Field(foreign_key="users.id", index=True)
    total_amount: float = Field(default=0)
    status: str = Field(default=OrderStatus.PENDING, index=True)
    user: User = Relationship(back_populates="orders")

    items: List["OrderItem"] = Relationship(
        back_populates="order",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )


class OrderItem(BaseTable, table=True):
    """Line items within an order"""
    __tablename__ = "order_items"

    order_id: int = Field(foreign_key="orders.id")
    product_id: int = Field(foreign_key="products.id")
    quantity: int = Field(gt=0)
    price: float = Field(ge=0)

    order: Order = Relationship(back_populates="items")
    product: Product = Relationship(sa_relationship_kwargs={"lazy": "selectin"})


# -----------------------------
# Schemas
# -----------------------------

class OrderItemCreate(SQLModel):
    product_id: int
    quantity: int


class OrderItemRead(BaseRead):
    id: int
    product_id: int
    quantity: int
    price: float
    product: Optional[Product] = None


class OrderCreate(SQLModel):
    """Used when converting a cart into an order"""
    cart_id: Optional[int] = None


class OrderRead(BaseRead):
    id: int
    user_id: int
    total_amount: float
    status: str
    items: Optional[List[OrderItemRead]] = None
