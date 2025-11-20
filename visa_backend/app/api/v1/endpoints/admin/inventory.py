from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional

from app.db import get_session
from app.models import Product, ProductVariant, User, Inventory
from app.core.deps import get_current_user, require_admin
from app.schemas.inventory import InventoryMovementRead

router = APIRouter()


# INVENTORY METRICS
@router.get("/metrics/")
def get_inventory_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    total_variants = session.exec(select(func.count(ProductVariant.id))).one()
    total_products = session.exec(select(func.count(Product.id))).one()
    total_stock = session.exec(select(func.sum(ProductVariant.stock_quantity))).one() or 0
    low_stock_items = session.exec(
        select(func.count(ProductVariant.id)).where(ProductVariant.stock_quantity <= 10)
    ).one()
    out_of_stock_items = session.exec(
        select(func.count(ProductVariant.id)).where(ProductVariant.stock_quantity == 0)
    ).one()

    return {
        "total_products": total_products or 0,
        "total_variants": total_variants or 0,
        "total_stock": int(total_stock),
        "low_stock_items": low_stock_items or 0,
        "out_of_stock_items": out_of_stock_items or 0,
    }


# GLOBAL INVENTORY MOVEMENTS
@router.get("/movements/", response_model=List[InventoryMovementRead])
def list_inventory_movements(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=1000),
):
    require_admin(current_user)

    query = (
        select(Inventory)
        .order_by(Inventory.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    movements = session.exec(query).all()
    return movements


# LOW-STOCK PRODUCT VARIANTS
@router.get("/low-stock/")
def list_low_stock_variants(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        threshold: int = Query(10, ge=1),
):
    require_admin(current_user)

    query = (
        select(ProductVariant)
        .where(ProductVariant.stock_quantity <= threshold)
        .order_by(ProductVariant.stock_quantity.asc())
        .offset(skip)
        .limit(limit)
    )

    variants = session.exec(query).all()

    results = []
    for v in variants:
        p = v.product
        results.append({
            "product_id": p.id,
            "product_name": p.name,
            "category": p.category,
            "is_active": p.is_active,
            "variant_id": v.id,
            "variant_name": v.name,
            "sku": v.sku,
            "stock_quantity": v.stock_quantity,
            "threshold": threshold,
            "is_default": v.is_default,
        })

    return results
