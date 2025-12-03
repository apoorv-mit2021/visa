from __future__ import annotations

from datetime import timedelta
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import Cart
from app.models.catalog import Product
from app.models.inventory import Inventory
from app.schemas.order import OrderCreate
from app.utils.common import utcnow


class OrderService:

    # -----------------------------------------------------
    # CREATE ORDER FROM CART (Supports Guest + Logged In)
    # -----------------------------------------------------
    @staticmethod
    def create_order_from_cart(
            db: Session,
            payload: OrderCreate,
            user_id: Optional[int] = None,
    ) -> Order:
        """
        Creates an order from a cart.

        - If user_id is provided → logged-in checkout
        - If user_id is None → guest checkout
        """

        # ---------------------------------------
        # FETCH CART
        # ---------------------------------------
        cart = None
        if payload.cart_id:
            cart = db.query(Cart).filter(Cart.id == payload.cart_id).first()
        elif user_id:
            cart = db.query(Cart).filter(Cart.user_id == user_id).first()

        if not cart or not cart.items:
            raise HTTPException(status_code=400, detail="Cart is empty or does not exist")

        total_amount = 0.0
        order_items: List[OrderItem] = []

        # ---------------------------------------
        # VERIFY STOCK FOR EACH CART ITEM
        # ---------------------------------------
        for item in cart.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"Invalid product: {item.product_id}")

            if not isinstance(product.sizes, dict):
                raise HTTPException(status_code=500, detail="Invalid product sizes format")

            available = product.sizes.get(item.size, 0)

            if available < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.sku} size {item.size}. Available: {available}",
                )

            price = product.price
            total_amount += price * item.quantity

            order_items.append(
                OrderItem(
                    product_id=item.product_id,
                    size=item.size,
                    quantity=item.quantity,
                    price=price,
                )
            )

        # ---------------------------------------
        # CREATE ORDER WITH ADDRESS SNAPSHOTS
        # ---------------------------------------
        order = Order(
            user_id=user_id,  # may be None for guest
            total_amount=total_amount,
            status=OrderStatus.PENDING,
            shipping_address=payload.shipping_address.model_dump(),
            billing_address=payload.billing_address.model_dump(),
        )
        db.add(order)
        db.flush()

        # ---------------------------------------
        # SAVE ORDER ITEMS
        # ---------------------------------------
        for oi in order_items:
            oi.order_id = order.id
            db.add(oi)

        # ---------------------------------------
        # DEDUCT INVENTORY
        # ---------------------------------------
        for item in cart.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                continue

            sizes = product.sizes or {}
            previous_qty = sizes.get(item.size, 0)
            new_qty = previous_qty - item.quantity

            sizes[item.size] = new_qty
            product.sizes = sizes

            inventory_log = Inventory(
                product_id=product.id,
                previous_quantity=previous_qty,
                change=-item.quantity,
                new_quantity=new_qty,
                reason="order_purchase",
                performed_by_id=user_id,
                note=f"size={item.size}",
            )
            db.add(inventory_log)

        # ---------------------------------------
        # CLEAR CART
        # ---------------------------------------
        cart.items.clear()

        db.commit()
        db.refresh(order)
        return order

    # -----------------------------------------------------
    # GET ORDER BY ID
    # -----------------------------------------------------
    @staticmethod
    def get_order(db: Session, order_id: int, user_id: Optional[int] = None) -> Order:
        query = db.query(Order).filter(Order.id == order_id)

        if user_id:
            query = query.filter(Order.user_id == user_id)

        order = query.first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        return order

    # -----------------------------------------------------
    # LIST ORDERS (Admin or User)
    # -----------------------------------------------------
    @staticmethod
    def list_orders(db: Session, user_id: Optional[int] = None, status: Optional[str] = None) -> List[Order]:
        query = db.query(Order)

        if user_id is not None:
            query = query.filter(Order.user_id == user_id)

        if status:
            query = query.filter(Order.status == status)

        return query.order_by(Order.id.desc()).all()

    # -----------------------------------------------------
    # UPDATE ORDER STATUS (ADMIN)
    # -----------------------------------------------------
    @staticmethod
    def update_order_status(db: Session, order_id: int, status: str) -> Order:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        valid_statuses = {
            OrderStatus.PENDING,
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.RETURNED,
        }

        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")

        # Restore stock if order is cancelled now but wasn’t cancelled before
        if status == OrderStatus.CANCELLED and order.status != OrderStatus.CANCELLED:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if not product:
                    continue

                sizes = product.sizes or {}
                previous_qty = sizes.get(item.size, 0)
                new_qty = previous_qty + item.quantity

                sizes[item.size] = new_qty
                product.sizes = sizes

                db.add(
                    Inventory(
                        product_id=product.id,
                        previous_quantity=previous_qty,
                        change=item.quantity,
                        new_quantity=new_qty,
                        reason="order_cancel",
                        note=f"size={item.size}",
                    )
                )

        order.status = status
        db.commit()
        db.refresh(order)
        return order

    # -----------------------------------------------------
    # DELETE ORDER (Admin-only)
    # -----------------------------------------------------
    @staticmethod
    def delete_order(db: Session, order_id: int) -> None:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        db.delete(order)
        db.commit()

    # -----------------------------------------------------
    # ORDER METRICS (Admin)
    # -----------------------------------------------------
    @staticmethod
    def get_order_metrics(db: Session) -> dict:
        total_orders = db.query(func.count(Order.id)).scalar() or 0

        pending_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.PENDING).scalar() or 0
        delivered_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.DELIVERED).scalar() or 0
        cancelled_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.CANCELLED).scalar() or 0

        total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0
        avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0

        seven_days_ago = utcnow() - timedelta(days=7)
        recent_orders = db.query(func.count(Order.id)).filter(Order.created_at >= seven_days_ago).scalar() or 0

        return {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "delivered_orders": delivered_orders,
            "cancelled_orders": cancelled_orders,
            "total_revenue": round(total_revenue, 2),
            "avg_order_value": avg_order_value,
            "orders_last_7_days": recent_orders,
        }
