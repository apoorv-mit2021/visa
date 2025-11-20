# backend/app/api/v1/endpoints/admin/order.py

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.core.deps import get_current_user, require_admin, require_staff
from app.core.deps import get_session
from app.models import Order, OrderRead, User
from app.utils.common import utcnow

router = APIRouter()


# ORDER METRICS
@router.get("/metrics/")
def get_order_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    total_orders = session.exec(select(func.count(Order.id))).one()
    pending_orders = session.exec(
        select(func.count(Order.id)).where(Order.status == "pending")
    ).one()
    completed_orders = session.exec(
        select(func.count(Order.id)).where(Order.status == "completed")
    ).one()
    cancelled_orders = session.exec(
        select(func.count(Order.id)).where(Order.status == "cancelled")
    ).one()
    total_revenue = session.exec(select(func.sum(Order.total_amount))).one() or 0.0
    avg_order_value = (
        round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0
    )
    seven_days_ago = utcnow() - timedelta(days=7)
    recent_orders = session.exec(
        select(func.count(Order.id)).where(Order.created_at >= seven_days_ago)
    ).one()

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "total_revenue": round(total_revenue, 2),
        "avg_order_value": avg_order_value,
        "orders_last_7_days": recent_orders,
    }


# LIST ORDERS
@router.get("/", response_model=List[OrderRead])
def list_orders(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        status: Optional[str] = None,
):
    require_staff(current_user)

    query = select(Order)
    if status:
        query = query.where(Order.status == status)

    query = query.order_by(Order.created_at.desc())
    orders = session.exec(query.offset(skip).limit(limit)).all()
    return orders


# GET SINGLE ORDER
@router.get("/{order_id}", response_model=OrderRead)
def get_order(
        order_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Get a specific order (admin/staff only)"""
    require_admin(current_user)

    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# UPDATE ORDER STATUS
@router.put("/{order_id}/status", response_model=OrderRead)
def update_order_status(
        order_id: int,
        status: str,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Update order status (admin/staff only)"""
    require_staff(current_user)

    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status
    session.add(order)
    session.commit()
    session.refresh(order)
    return order
