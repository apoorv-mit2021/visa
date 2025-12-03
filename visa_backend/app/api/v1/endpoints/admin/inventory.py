# app/api/v1/endpoints/admin/inventory.py

from typing import List

from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryRead
from app.services.inventory_service import InventoryService

router = APIRouter()


# ---------------------------------------------------------
# INVENTORY METRICS
# ---------------------------------------------------------
@router.get("/metrics/")
def get_inventory_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return InventoryService.get_inventory_metrics(db)


# ---------------------------------------------------------
# LIST INVENTORY MOVEMENTS (LATEST FIRST)
# ---------------------------------------------------------
@router.get("/movements/", response_model=List[InventoryRead])
def list_inventory_movements(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        limit: int = Query(50, ge=1, le=200),
        offset: int = Query(0, ge=0),
):
    require_staff(current_user)

    movements = InventoryService.list_movements(
        db=db,
        limit=limit,
        offset=offset,
    )

    return [InventoryRead.model_validate(m) for m in movements]


# ---------------------------------------------------------
# CREATE INVENTORY MOVEMENT (ADMIN)
# ---------------------------------------------------------
@router.post("/", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
def create_inventory_entry(
        payload: InventoryCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    # Auto bind admin as performer
    payload.performed_by_id = current_user.id

    movement = InventoryService.create_movement(db, payload)

    return InventoryRead.model_validate(movement)


# ---------------------------------------------------------
# LOW STOCK PRODUCTS (PER-SIZE)
# ---------------------------------------------------------
@router.get("/low-stock/")
def list_low_stock_products(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        threshold: int = Query(5, ge=1),
):
    require_staff(current_user)

    low_stock = InventoryService.get_low_stock_products(
        db=db,
        threshold=threshold
    )

    # Service already returns dicts → safe to output directly
    return low_stock
