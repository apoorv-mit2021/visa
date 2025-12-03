from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user_optional, get_current_user
from app.schemas.order import OrderCreate, OrderRead
from app.services.order_service import OrderService
from app.models.user import User
from app.models.order import OrderStatus

router = APIRouter()


# ---------------------------------------------------------
# CREATE ORDER (Guest or Logged-in)
# ---------------------------------------------------------
@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def store_create_order(
        data: OrderCreate,
        db: Session = Depends(get_session),
        current_user: Optional[User] = Depends(get_current_user_optional),
):
    user_id = current_user.id if current_user else None

    order = OrderService.create_order_from_cart(
        db=db,
        payload=data,
        user_id=user_id
    )

    return OrderRead.model_validate(order)


# ---------------------------------------------------------
# LIST USER ORDERS (Logged-in only)
# ---------------------------------------------------------
@router.get("/", response_model=List[OrderRead])
def store_list_orders(
        status_filter: Optional[str] = Query(None),
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    orders = OrderService.list_orders(
        db=db,
        user_id=current_user.id,
        status=status_filter
    )
    return [OrderRead.model_validate(o) for o in orders]


# ---------------------------------------------------------
# GET USER ORDER BY ID
# ---------------------------------------------------------
@router.get("/{order_id}", response_model=OrderRead)
def store_get_order(
        order_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    order = OrderService.get_order(db, order_id, user_id=current_user.id)
    return OrderRead.model_validate(order)


# ---------------------------------------------------------
# CANCEL ORDER (User)
# ---------------------------------------------------------
@router.put("/{order_id}/cancel", response_model=OrderRead)
def store_cancel_order(
        order_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    order = OrderService.get_order(db, order_id, user_id=current_user.id)

    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only PENDING orders can be cancelled")

    updated = OrderService.update_order_status(db, order_id, OrderStatus.CANCELLED)
    return OrderRead.model_validate(updated)
