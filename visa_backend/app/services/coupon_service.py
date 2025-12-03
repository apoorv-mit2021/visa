# app/services/coupon_service.py

from __future__ import annotations
from datetime import datetime
from typing import Optional, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate


class CouponService:

    # --------------------------------------------------
    # VALIDATION HELPERS
    # --------------------------------------------------
    @staticmethod
    def _validate_coupon_data(data: CouponCreate | CouponUpdate):
        if data.discount_type not in ("percentage", "fixed"):
            raise HTTPException(
                status_code=400,
                detail="discount_type must be 'percentage' or 'fixed'",
            )

        if data.discount_type == "percentage" and not data.discount_value:
            raise HTTPException(
                status_code=400,
                detail="discount_value is required for percentage coupons",
            )

        if data.discount_type == "fixed" and not data.fixed_discounts:
            raise HTTPException(
                status_code=400,
                detail="fixed_discounts required for fixed-type coupons",
            )

        if data.start_date and data.end_date and data.start_date > data.end_date:
            raise HTTPException(
                status_code=400,
                detail="start_date cannot be after end_date",
            )

    # --------------------------------------------------
    # CREATE COUPON
    # --------------------------------------------------
    @staticmethod
    def create_coupon(db: Session, data: CouponCreate) -> Coupon:
        CouponService._validate_coupon_data(data)

        if db.query(Coupon).filter(Coupon.code == data.code).first():
            raise HTTPException(status_code=400, detail="Coupon code already exists")

        coupon = Coupon(**data.model_dump())
        db.add(coupon)
        db.commit()
        db.refresh(coupon)
        return coupon

    # --------------------------------------------------
    # GET SINGLE COUPON
    # --------------------------------------------------
    @staticmethod
    def get_coupon(db: Session, coupon_id: int) -> Coupon:
        coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")
        return coupon

    # --------------------------------------------------
    # LIST COUPONS
    # --------------------------------------------------
    @staticmethod
    def list_coupons(
            db: Session,
            search: Optional[str] = None,
            active_only: Optional[bool] = None,
            skip: int = 0,
            limit: int = 100,
    ) -> List[Coupon]:

        query = db.query(Coupon)

        if search:
            like = f"%{search}%"
            query = query.filter(Coupon.code.ilike(like))

        if active_only is not None:
            query = query.filter(Coupon.is_active == active_only)

        return query.order_by(Coupon.created_at.desc()).offset(skip).limit(limit).all()

    # --------------------------------------------------
    # UPDATE COUPON
    # --------------------------------------------------
    @staticmethod
    def update_coupon(
            db: Session, coupon_id: int, data: CouponUpdate
    ) -> Coupon:
        coupon = CouponService.get_coupon(db, coupon_id)

        CouponService._validate_coupon_data(data)

        update_data = data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(coupon, key, value)

        db.commit()
        db.refresh(coupon)
        return coupon

    # --------------------------------------------------
    # DELETE COUPON
    # --------------------------------------------------
    @staticmethod
    def delete_coupon(db: Session, coupon_id: int) -> None:
        coupon = CouponService.get_coupon(db, coupon_id)
        db.delete(coupon)
        db.commit()

    # --------------------------------------------------
    # STORE — VALIDATE COUPON AND RETURN DISCOUNT
    # --------------------------------------------------
    @staticmethod
    def apply_coupon(
            db: Session, code: str, order_total: float, currency: str = "USD"
    ) -> dict:

        coupon = db.query(Coupon).filter(Coupon.code == code).first()
        if not coupon:
            raise HTTPException(status_code=404, detail="Coupon not found")

        # Check active
        if not coupon.is_active:
            raise HTTPException(status_code=400, detail="Coupon is inactive")

        # Check usage limit
        if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")

        # Date validity
        now = datetime.utcnow()
        if coupon.start_date and now < coupon.start_date:
            raise HTTPException(status_code=400, detail="Coupon not yet active")

        if coupon.end_date and now > coupon.end_date:
            raise HTTPException(status_code=400, detail="Coupon expired")

        # Minimum order value
        if coupon.min_order_value and order_total < coupon.min_order_value:
            raise HTTPException(status_code=400, detail="Order amount too low")

        # ----- Calculate Discount -----
        if coupon.discount_type == "percentage":
            discount = (order_total * coupon.discount_value) / 100
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)
        else:
            discount = coupon.fixed_discounts.get(currency.upper())
            if not discount:
                raise HTTPException(
                    status_code=400,
                    detail=f"No fixed discount defined for currency: {currency}",
                )

        final_amount = max(order_total - discount, 0)

        return {
            "coupon_id": coupon.id,
            "code": coupon.code,
            "discount": round(discount, 2),
            "final_amount": round(final_amount, 2),
        }

    # --------------------------------------------------
    # METRICS
    # --------------------------------------------------
    @staticmethod
    def get_metrics(db: Session) -> dict:
        now = datetime.utcnow()

        total_coupons = db.query(Coupon).count()

        active_coupons = (
            db.query(Coupon)
            .filter(
                Coupon.is_active == True,
                (Coupon.start_date == None) | (Coupon.start_date <= now),
                (Coupon.end_date == None) | (Coupon.end_date >= now),
            )
            .count()
        )

        expired_coupons = (
            db.query(Coupon)
            .filter(
                Coupon.end_date != None,
                Coupon.end_date < now,
            )
            .count()
        )

        total_redemptions = (
            db.query(Coupon).filter(Coupon.used_count > 0)
            .with_entities(Coupon.used_count)
            .all()
        )

        total_redemptions = sum(row.used_count for row in total_redemptions)

        return {
            "total_coupons": total_coupons,
            "active_coupons": active_coupons,
            "expired_coupons": expired_coupons,
            "total_redemptions": total_redemptions,
        }
