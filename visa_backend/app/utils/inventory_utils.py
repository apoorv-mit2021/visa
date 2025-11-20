# app/utils/inventory_utils.py

from sqlmodel import Session
from fastapi import HTTPException

from app.models.inventory import Inventory
from app.models.product_variant import ProductVariant
from app.models.user import User


# INTERNAL HELPER
def _create_inventory_record(
        session: Session,
        variant: ProductVariant,
        change: int,
        reason: str,
        performed_by: User | None = None,
        note: str | None = None,
):
    """Internal method to create and save an inventory record."""
    previous_qty = variant.stock_quantity
    new_qty = previous_qty + change

    if new_qty < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reduce stock below zero. Variant {variant.id} has {previous_qty} left.",
        )

    # Apply update
    variant.stock_quantity = new_qty

    # Create inventory audit record
    record = Inventory(
        variant_id=variant.id,
        previous_quantity=previous_qty,
        change=change,
        new_quantity=new_qty,
        reason=reason,
        note=note,
        performed_by_id=performed_by.id if performed_by else None,
    )

    session.add(record)
    session.add(variant)
    session.commit()
    session.refresh(record)
    session.refresh(variant)

    return record


# Admin stock update
def inventory_admin_update(
        session: Session,
        variant_id: int,
        new_stock: int,
        performed_by: User,
        note: str | None = None,
):
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")

    change = new_stock - variant.stock_quantity

    return _create_inventory_record(
        session=session,
        variant=variant,
        change=change,
        reason="admin_update",
        performed_by=performed_by,
        note=note,
    )


# Purchase: decrease stock
def inventory_order_purchase(
        session: Session,
        variant_id: int,
        quantity: int,
        user: User | None = None,
):
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")

    return _create_inventory_record(
        session=session,
        variant=variant,
        change=-quantity,
        reason="order_purchase",
        performed_by=user,
        note=f"Order purchase: -{quantity}",
    )


# Order cancellation: restore stock
def inventory_order_cancel(
        session: Session,
        variant_id: int,
        quantity: int,
        performed_by: User | None = None,
):
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")

    return _create_inventory_record(
        session=session,
        variant=variant,
        change=quantity,
        reason="order_cancel",
        performed_by=performed_by,
        note=f"Order canceled: +{quantity}",
    )


# Restock
def inventory_restock(
        session: Session,
        variant_id: int,
        quantity: int,
        performed_by: User,
        note: str | None = None,
):
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")

    return _create_inventory_record(
        session=session,
        variant=variant,
        change=quantity,
        reason="restock",
        performed_by=performed_by,
        note=note,
    )


# Damage / Lost / Breakage
def inventory_damage(
        session: Session,
        variant_id: int,
        quantity: int,
        performed_by: User,
        note: str | None = None,
):
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")

    return _create_inventory_record(
        session=session,
        variant=variant,
        change=-quantity,
        reason="damage",
        performed_by=performed_by,
        note=note,
    )


# System adjustment
def inventory_system_adjust(
        session: Session,
        variant_id: int,
        new_stock: int,
        note: str | None = None,
):
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")

    change = new_stock - variant.stock_quantity

    return _create_inventory_record(
        session=session,
        variant=variant,
        change=change,
        reason="system_adjust",
        performed_by=None,
        note=note,
    )
