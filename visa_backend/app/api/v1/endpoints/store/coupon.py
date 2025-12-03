# app/api/v1/endpoints/store/coupon.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.services.coupon_service import CouponService
from app.models.user import User

router = APIRouter()


# ---------------------------------------------------------
# APPLY COUPON (STORE)
# ---------------------------------------------------------
@router.get("/apply")
def apply_coupon(
        code: str = Query(..., description="Coupon code"),
        order_total: float = Query(..., ge=0),
        currency: str = Query("USD"),
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Apply a coupon and calculate discount for the authenticated customer.
    """
    result = CouponService.apply_coupon(
        db=db,
        code=code,
        order_total=order_total,
        currency=currency,
    )
    return result
