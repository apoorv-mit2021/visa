# app/schemas/wishlist.py

from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.models.base import BaseRead
from app.schemas.catalog import ProductRead


# ---------------------------
# Wishlist Item Schemas
# ---------------------------
class WishlistItemCreate(BaseModel):
    product_id: int


class WishlistItemRead(BaseRead):
    id: int
    wishlist_id: int
    product_id: int
    product: Optional[ProductRead] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------
# Wishlist Schema
# ---------------------------
class WishlistRead(BaseRead):
    id: int
    user_id: int
    items: List[WishlistItemRead] = []

    model_config = ConfigDict(from_attributes=True)
