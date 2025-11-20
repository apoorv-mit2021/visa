# app/models/inventory.py

from typing import Optional
from sqlmodel import Field, Relationship
from app.models.base import BaseTable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.product_variant import ProductVariant
    from app.models.user import User


class Inventory(BaseTable, table=True):
    __tablename__ = "inventory"

    variant_id: int = Field(foreign_key="product_variants.id", index=True)
    product_variant: "ProductVariant" = Relationship(back_populates="inventory")

    previous_quantity: int = Field(default=0)
    change: int = Field(default=0)
    new_quantity: int = Field(default=0)

    reason: str = Field(
        max_length=100,
        description="admin_update / order_purchase / order_cancel / system_adjust / restock / transfer / damage / audit",
    )
    note: Optional[str] = Field(default=None)

    performed_by_id: Optional[int] = Field(default=None, foreign_key="users.id")
    performed_by: Optional["User"] = Relationship()
