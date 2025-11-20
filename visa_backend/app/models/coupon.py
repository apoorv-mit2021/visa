# app/models/coupon.py

from datetime import datetime
from typing import Optional, Dict

from sqlmodel import SQLModel, Field
from sqlalchemy import JSON, Column

from .base import BaseTable, BaseRead


class CouponBase(SQLModel):
    """Base Coupon model with shared fields"""

    code: str = Field(
        index=True,
        unique=True,
        min_length=1,
        max_length=50,
        description="Unique coupon code"
    )

    description: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Short description of the coupon"
    )

    discount_type: str = Field(
        default="percentage",
        description="percentage | fixed"
    )

    # Only used for percentage-based discounts
    discount_value: Optional[float] = Field(
        default=None,
        gt=0,
        description="Percentage discount (e.g., 10 means 10%)"
    )

    fixed_discounts: Dict[str, float] = Field(
        default_factory=dict,
        sa_column=Column(JSON),
        description="Fixed discount per currency, e.g. { 'USD': 10, 'INR': 800 }"
    )

    min_order_value: Optional[float] = Field(
        default=None,
        ge=0,
        description="Minimum order amount to apply coupon"
    )

    max_discount_amount: Optional[float] = Field(
        default=None,
        ge=0,
        description="Max discount allowed (percentage type only)"
    )

    usage_limit: Optional[int] = Field(
        default=None,
        ge=1,
        description="Max total uses of the coupon"
    )

    # used_count is server-managed; not exposed for create/update

    start_date: Optional[datetime] = Field(
        default=None,
        description="Coupon validity start date"
    )

    end_date: Optional[datetime] = Field(
        default=None,
        description="Coupon validity end date"
    )


class Coupon(CouponBase, BaseTable, table=True):
    """Coupon table model"""
    __tablename__ = "coupons"
    # Keep usage counter only on the DB model so clients can't set it
    used_count: int = Field(
        default=0,
        ge=0,
        description="Total times coupon was used"
    )


class CouponCreate(CouponBase):
    """Schema for creating a coupon"""
    pass


class CouponUpdate(SQLModel):
    """Schema for updating a coupon (all fields optional)"""

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


class CouponRead(CouponBase, BaseRead):
    """Schema returned when reading coupon data."""
    id: int
    is_active: bool
    used_count: int
