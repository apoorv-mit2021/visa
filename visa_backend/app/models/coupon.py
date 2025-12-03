# app/models/coupon.py

from __future__ import annotations

from sqlalchemy import String, Float, Integer, JSON, DateTime
from sqlalchemy.orm import mapped_column

from app.models.base import Base, BaseTableMixin


class Coupon(Base, BaseTableMixin):
    __tablename__ = "coupons"

    code = mapped_column(String(50), unique=True, nullable=False, index=True)
    description = mapped_column(String(255), nullable=True)

    # percentage | fixed
    discount_type = mapped_column(String(20), default="percentage", nullable=False)

    # Only for percentage-based discount
    discount_value = mapped_column(Float, nullable=True)

    # JSON: { 'USD': 10, 'INR': 800 }
    fixed_discounts = mapped_column(JSON, default=dict, nullable=False)

    min_order_value = mapped_column(Float, nullable=True)
    max_discount_amount = mapped_column(Float, nullable=True)

    usage_limit = mapped_column(Integer, nullable=True)
    used_count = mapped_column(Integer, default=0, nullable=False)

    start_date = mapped_column(DateTime, nullable=True)
    end_date = mapped_column(DateTime, nullable=True)
