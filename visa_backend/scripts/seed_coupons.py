#!/usr/bin/env python3
"""
Seed the database with sample coupons.
Safe to run multiple times — existing coupons are skipped.
"""

import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.db import engine
from app.models.coupon import Coupon


# Helper: UTC now (timezone-aware)
def utcnow():
    return datetime.now(timezone.utc)


# -----------------------------------------
# SAMPLE COUPONS
# -----------------------------------------
sample_coupons = [
    {
        "code": "WELCOME10",
        "description": "10% off for new users",
        "discount_type": "percentage",
        "discount_value": 10,
        "fixed_discounts": {},
        "min_order_value": 1000,
        "max_discount_amount": 500,
        "usage_limit": 100,
        "used_count": 0,
        "start_date": utcnow(),
        "end_date": utcnow() + timedelta(days=30),
        "is_active": True,
    },
    {
        "code": "FLAT500",
        "description": "Flat $500 off on any purchase",
        "discount_type": "fixed",
        "discount_value": None,
        "fixed_discounts": {"CAD": 500},
        "min_order_value": 2000,
        "max_discount_amount": None,
        "usage_limit": 50,
        "used_count": 0,
        "start_date": utcnow(),
        "end_date": utcnow() + timedelta(days=45),
        "is_active": True,
    },
    {
        "code": "USD15OFF",
        "description": "Flat $15 OFF",
        "discount_type": "fixed",
        "discount_value": None,
        "fixed_discounts": {"CAD": 15},
        "min_order_value": 50,
        "max_discount_amount": None,
        "usage_limit": None,
        "used_count": 0,
        "start_date": utcnow(),
        "end_date": utcnow() + timedelta(days=60),
        "is_active": True,
    },
    {
        "code": "FESTIVE20",
        "description": "20% Festive Season Discount",
        "discount_type": "percentage",
        "discount_value": 20,
        "fixed_discounts": {},
        "min_order_value": 500,
        "max_discount_amount": 1000,
        "usage_limit": 200,
        "used_count": 0,
        "start_date": utcnow(),
        "end_date": utcnow() + timedelta(days=15),
        "is_active": True,
    },
]


# -----------------------------------------
# SEED FUNCTION
# -----------------------------------------
def seed_coupons():
    with Session(engine) as session:

        existing_codes = {c.code for c in session.exec(select(Coupon)).all()}

        for data in sample_coupons:

            if data["code"] in existing_codes:
                print(f"ℹ️ Skipping (already exists): {data['code']}")
                continue

            coupon = Coupon(**data)
            session.add(coupon)

        session.commit()
        print("🎉 Coupon seeding complete!")


# -----------------------------------------
# RUN SCRIPT
# -----------------------------------------
if __name__ == "__main__":
    seed_coupons()
