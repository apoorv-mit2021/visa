from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class InventoryMovementRead(BaseModel):
    id: int
    variant_id: int
    previous_quantity: int
    change: int
    new_quantity: int
    reason: str
    note: Optional[str]
    performed_by_id: Optional[int]
    performed_by_name: Optional[str] = None
    created_at: datetime
