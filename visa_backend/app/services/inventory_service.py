# app/services/inventory_service.py

from __future__ import annotations
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.catalog import Product
from app.models.inventory import Inventory
from app.schemas.inventory import InventoryCreate


class InventoryService:

    # ---------------------------------------------------------
    # CREATE INVENTORY MOVEMENT (ADMIN)
    # ---------------------------------------------------------
    @staticmethod
    def create_movement(db: Session, data: InventoryCreate) -> Inventory:
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Log movement
        movement = Inventory(
            product_id=data.product_id,
            previous_quantity=data.previous_quantity,
            change=data.change,
            new_quantity=data.new_quantity,
            reason=data.reason,
            note=data.note,
            performed_by_id=data.performed_by_id,
        )

        # Update product stock
        product.sizes = product.sizes  # untouched unless needed
        product.stock = data.new_quantity

        db.add(movement)
        db.add(product)
        db.commit()
        db.refresh(movement)
        return movement

    # ---------------------------------------------------------
    # GET INVENTORY MOVEMENTS — LATEST FIRST
    # ---------------------------------------------------------
    @staticmethod
    def list_movements(
            db: Session, limit: int = 50, offset: int = 0
    ) -> List[Inventory]:
        return (
            db.query(Inventory)
            .order_by(Inventory.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    # ---------------------------------------------------------
    # METRICS
    # ---------------------------------------------------------
    @staticmethod
    def get_inventory_metrics(db: Session) -> dict:
        # Total products
        total_products = db.query(func.count(Product.id)).scalar() or 0

        # Total stock across all inventory entries
        total_stock = db.query(func.sum(Inventory.new_quantity)).scalar() or 0

        # Group by product → sum(stock)
        product_stock = (
            db.query(
                Inventory.product_id,
                func.sum(Inventory.new_quantity).label("total_stock")
            )
            .group_by(Inventory.product_id)
            .all()
        )

        low_stock_items = sum(1 for p in product_stock if 0 < p.total_stock < 5)
        out_of_stock_items = sum(1 for p in product_stock if p.total_stock <= 0)

        return {
            "total_products": total_products,
            "total_stock": int(total_stock),
            "low_stock_items": low_stock_items,
            "out_of_stock_items": out_of_stock_items,
        }

    # ---------------------------------------------------------
    # GET LOW STOCK PRODUCTS
    # ---------------------------------------------------------
    @staticmethod
    def get_low_stock_products(
            db: Session, threshold: int = 5
    ) -> List[dict]:
        products = db.query(Product).all()

        low_stock_list = []

        for p in products:
            if not isinstance(p.sizes, dict):
                continue

            # Find sizes below threshold (but > 0)
            low_sizes = {
                size: qty
                for size, qty in p.sizes.items()
                if isinstance(qty, int) and 0 < qty < threshold
            }

            if low_sizes:
                low_stock_list.append({
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "category": p.category,
                    "low_sizes": low_sizes,  # 👈 sizes that are running low
                    "total_stock": sum(p.sizes.values())
                })

        return low_stock_list

    @staticmethod
    def get_out_of_stock_products(db: Session) -> List[dict]:
        products = db.query(Product).all()
        out = []

        for p in products:
            zero_sizes = {
                size: qty
                for size, qty in p.sizes.items()
                if isinstance(qty, int) and qty == 0
            }

            if zero_sizes:
                out.append({
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "category": p.category,
                    "out_of_stock_sizes": zero_sizes,
                })

        return out
