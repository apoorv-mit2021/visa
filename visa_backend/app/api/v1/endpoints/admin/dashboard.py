# app/api/v1/endpoints/admin/dashboard.py
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.schemas.case import SupportCaseRead
from app.schemas.order import OrderRead
from app.services.dashboard_service import DashboardService
from app.services.inventory_service import InventoryService
from app.models.user import User

router = APIRouter()


@router.get("/metrics/")
def get_dashboard_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return DashboardService.get_dashboard_metrics(session)


@router.get("/sales/monthly")
def get_monthly_sales(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return DashboardService.get_monthly_sales(session)


@router.get("/target/monthly")
def get_monthly_target(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return DashboardService.get_monthly_target(session)


@router.get("/orders/recent", response_model=List[OrderRead])
def get_recent_orders(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    orders = DashboardService.get_recent_orders(session)
    return [OrderRead.model_validate(o) for o in orders]


@router.get("/support/recent", response_model=List[SupportCaseRead])
def get_recent_orders(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    cases = DashboardService.get_recent_cases(session)
    return [SupportCaseRead.model_validate(case) for case in cases]


@router.get("/products/low-stock")
def get_low_stock_products(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return InventoryService.get_low_stock_products(session)


@router.get("/statistics")
def get_sales_statistics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return DashboardService.get_statistics(session)
