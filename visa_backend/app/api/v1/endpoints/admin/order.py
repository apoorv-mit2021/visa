# backend/app/api/v1/endpoints/admin/order.py


from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.services.order_service import OrderService
from app.schemas.order import OrderRead
from app.models.user import User
from app.models.order import OrderStatus

router = APIRouter()


# ORDER METRICS
@router.get("/metrics/")
def get_order_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return OrderService.get_order_metrics(db)


# ------------------------------
# LIST ALL ORDERS (ADMIN)
# ------------------------------
@router.get("/", response_model=List[OrderRead])
def admin_list_orders(
        status_filter: Optional[str] = Query(None),
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    orders = OrderService.list_orders(
        db=db,
        user_id=None,
        status=status_filter,
    )

    return [OrderRead.model_validate(o) for o in orders]


# ------------------------------
# GET ORDER BY ID (ADMIN)
# ------------------------------
@router.get("/{order_id}", response_model=OrderRead)
def admin_get_order(
        order_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)

    order = OrderService.get_order(db, order_id)
    return OrderRead.model_validate(order)


# ------------------------------
# UPDATE ORDER STATUS (ADMIN)
# ------------------------------
@router.put("/{order_id}/status", response_model=OrderRead)
def admin_update_order_status(
        order_id: int,
        status: str,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    if status not in {
        OrderStatus.PENDING,
        OrderStatus.PAID,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.RETURNED,
    }:
        raise HTTPException(status_code=400, detail="Invalid status")

    order = OrderService.update_order_status(db, order_id, status)
    return OrderRead.model_validate(order)


# ------------------------------
# DELETE ORDER (ADMIN)
# ------------------------------
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_order(
        order_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    OrderService.delete_order(db, order_id)
    return None
