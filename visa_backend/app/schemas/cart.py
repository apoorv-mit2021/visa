# app/schemas/cart.py

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.base import BaseRead
from app.schemas.catalog import ProductRead


# ---------------------------
# Cart Item Schemas
# ---------------------------
class CartItemCreate(BaseModel):
    product_id: int
    size: str
    quantity: int = Field(gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemRead(BaseRead):
    id: int
    cart_id: int
    product_id: int
    size: str
    quantity: int
    product: Optional[ProductRead] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------
# Cart Schema
# ---------------------------
class CartRead(BaseRead):
    id: int
    user_id: int
    items: List[CartItemRead] = []

    model_config = ConfigDict(from_attributes=True)
