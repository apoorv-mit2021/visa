# app/schemas/order.py

from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from app.models.base import BaseRead
from app.schemas.catalog import ProductRead


# -----------------------------
# ORDER ADDRESS SCHEMA
# -----------------------------
class AddressSnapshot(BaseModel):
    name: str
    street: str
    apartment: Optional[str] = None
    city: str
    state: str
    zip: str
    country: str


# -----------------------------
# ORDER ITEM SCHEMAS
# -----------------------------
class OrderItemCreate(BaseModel):
    product_id: int
    size: str
    quantity: int


class OrderItemRead(BaseRead):
    id: int
    product_id: int
    size: str
    quantity: int
    price: float
    product: Optional[ProductRead] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# ORDER SCHEMAS
# -----------------------------
class OrderCreate(BaseModel):
    """Used when converting a cart into an order."""
    shipping_address: AddressSnapshot
    billing_address: AddressSnapshot
    cart_id: Optional[int] = None


class OrderRead(BaseRead):
    id: int
    user_id: Optional[int]
    total_amount: float
    status: str

    shipping_address: AddressSnapshot
    billing_address: AddressSnapshot

    items: List[OrderItemRead] = []

    model_config = ConfigDict(from_attributes=True)
