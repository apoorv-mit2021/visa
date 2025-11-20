# app/api/v1/endpoints/admin/coupon.py

from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.core.deps import get_session, get_current_user, require_staff
from app.models import Coupon, CouponCreate, CouponRead, CouponUpdate, User
from app.utils.common import utcnow
from app.utils.currency import ALLOWED_CURRENCIES

router = APIRouter()


def validate_coupon_payload(data: Dict):
    """
    Validates discount_type / discount_value / fixed_discounts rules.
    """
    discount_type = data.get("discount_type")
    discount_value = data.get("discount_value")
    fixed_discounts = data.get("fixed_discounts")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if discount_type not in ("percentage", "fixed"):
        raise HTTPException(
            status_code=400,
            detail="discount_type must be either 'percentage' or 'fixed'",
        )

    if discount_type == "percentage":
        if not discount_value:
            raise HTTPException(
                status_code=400,
                detail="discount_value is required for percentage coupons",
            )
        if discount_value <= 0 or discount_value > 100:
            raise HTTPException(
                status_code=400,
                detail="discount_value must be between 1 and 100",
            )

    if discount_type == "fixed":
        if not fixed_discounts:
            raise HTTPException(
                status_code=400,
                detail="fixed_discounts is required for fixed coupons",
            )
        # Validate currencies
        for currency, amount in fixed_discounts.items():
            if currency not in ALLOWED_CURRENCIES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported currency '{currency}'. Allowed: {ALLOWED_CURRENCIES}",
                )
            if not isinstance(amount, (int, float)):
                raise HTTPException(
                    status_code=400,
                    detail="All fixed discount values must be numeric",
                )
            if amount <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="All fixed discount values must be > 0",
                )

    # start/end date consistency
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be before or equal to end_date",
        )


@router.get("/metrics/")
def get_coupon_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    now = utcnow()

    total_coupons = session.exec(select(func.count(Coupon.id))).one()
    active_coupons = session.exec(
        select(func.count(Coupon.id)).where(Coupon.is_active == True)
    ).one()

    expired_coupons = session.exec(
        select(func.count(Coupon.id)).where(
            Coupon.end_date.is_not(None),
            Coupon.end_date < now
        )
    ).one()

    total_redemptions = (
            session.exec(select(func.sum(Coupon.used_count))).one() or 0
    )

    return {
        "total_coupons": total_coupons,
        "active_coupons": active_coupons,
        "expired_coupons": expired_coupons,
        "total_redemptions": total_redemptions,
    }


@router.post("/", response_model=CouponRead, status_code=status.HTTP_201_CREATED)
def create_coupon(
        coupon: CouponCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    existing = session.exec(
        select(Coupon).where(Coupon.code == coupon.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    validate_coupon_payload(coupon.model_dump())

    db_coupon = Coupon(**coupon.model_dump())
    session.add(db_coupon)
    session.commit()
    session.refresh(db_coupon)
    return db_coupon


@router.get("/", response_model=List[CouponRead])
def list_coupons(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, le=1000),
        is_active: Optional[bool] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    query = select(Coupon)

    if is_active is not None:
        query = query.where(Coupon.is_active == is_active)

    query = query.order_by(Coupon.created_at.desc()).offset(skip).limit(limit)

    return session.exec(query).all()


@router.get("/{coupon_id}", response_model=CouponRead)
def get_coupon(
        coupon_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    coupon = session.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon


@router.put("/{coupon_id}", response_model=CouponRead)
def update_coupon(
        coupon_id: int,
        update_data: CouponUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    db_coupon = session.get(Coupon, coupon_id)
    if not db_coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    data = update_data.model_dump(exclude_unset=True)

    # If code is being changed, ensure uniqueness
    new_code = data.get("code")
    if new_code and new_code != db_coupon.code:
        existing = session.exec(
            select(Coupon).where(Coupon.code == new_code, Coupon.id != db_coupon.id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")

    validate_coupon_payload({**db_coupon.model_dump(), **data})

    for key, value in data.items():
        setattr(db_coupon, key, value)

    session.add(db_coupon)
    session.commit()
    session.refresh(db_coupon)
    return db_coupon


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(
        coupon_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    coupon = session.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    session.delete(coupon)
    session.commit()
