# app/api/v1/endpoints/admin/coupon.py

from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query

from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponRead
from app.services.coupon_service import CouponService
from app.models.user import User

router = APIRouter()


# ---------------------------------------------------------
# CREATE COUPON
# ---------------------------------------------------------
@router.post("/", response_model=CouponRead, status_code=status.HTTP_201_CREATED)
def create_coupon(
        data: CouponCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    coupon = CouponService.create_coupon(db, data)
    return CouponRead.model_validate(coupon)


# ---------------------------------------------------------
# LIST COUPONS
# ---------------------------------------------------------
@router.get("/", response_model=List[CouponRead])
def list_coupons(
        search: Optional[str] = None,
        active_only: Optional[bool] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    coupons = CouponService.list_coupons(
        db=db, search=search, active_only=active_only, skip=skip, limit=limit
    )
    return [CouponRead.model_validate(c) for c in coupons]


# ---------------------------------------------------------
# GET SINGLE COUPON
# ---------------------------------------------------------
@router.get("/{coupon_id}", response_model=CouponRead)
def get_coupon(
        coupon_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    coupon = CouponService.get_coupon(db, coupon_id)
    return CouponRead.model_validate(coupon)


# ---------------------------------------------------------
# UPDATE COUPON
# ---------------------------------------------------------
@router.put("/{coupon_id}", response_model=CouponRead)
def update_coupon(
        coupon_id: int,
        data: CouponUpdate,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    coupon = CouponService.update_coupon(db, coupon_id, data)
    return CouponRead.model_validate(coupon)


# ---------------------------------------------------------
# DELETE COUPON
# ---------------------------------------------------------
@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(
        coupon_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    CouponService.delete_coupon(db, coupon_id)
    return None


# Coupon Metrics
@router.get("/metrics/")
def get_product_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return CouponService.get_metrics(db)