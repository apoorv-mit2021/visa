# app/schemas/coupon.py

from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.base import BaseRead


# -----------------------------------------------------
# BASE COUPON SCHEMA
# -----------------------------------------------------
class CouponBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None

    discount_type: str = Field(
        default="percentage",
        description="percentage | fixed",
    )

    # Percentage discount (only for percentage type)
    discount_value: Optional[float] = None

    # Fixed discount per currency
    fixed_discounts: Dict[str, float] = Field(default_factory=dict)

    min_order_value: Optional[float] = None
    max_discount_amount: Optional[float] = None

    usage_limit: Optional[int] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# -----------------------------------------------------
# CREATE COUPON
# -----------------------------------------------------
class CouponCreate(CouponBase):
    pass


# -----------------------------------------------------
# UPDATE COUPON
# -----------------------------------------------------
class CouponUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None

    fixed_discounts: Optional[Dict[str, float]] = None

    min_order_value: Optional[float] = None
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None

    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    is_active: Optional[bool] = None


# -----------------------------------------------------
# READ COUPON
# -----------------------------------------------------
class CouponRead(CouponBase, BaseRead):
    id: int
    is_active: bool
    used_count: int

    model_config = ConfigDict(from_attributes=True)
