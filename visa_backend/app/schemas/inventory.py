# app/schemas/inventory.py

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.base import BaseRead


class InventoryCreate(BaseModel):
    product_id: int
    previous_quantity: int
    change: int
    new_quantity: int
    reason: str
    note: Optional[str] = None
    performed_by_id: Optional[int] = None


class InventoryRead(BaseRead):
    id: int
    product_id: int
    previous_quantity: int
    change: int
    new_quantity: int
    reason: str
    note: Optional[str]
    performed_by_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)
