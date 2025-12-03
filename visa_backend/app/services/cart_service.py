# app/services/cart_service.py

from __future__ import annotations
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.cart import Cart, CartItem
from app.models.catalog import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate  # (we'll define below)


class CartService:

    # -----------------------------------------------------
    # Ensure cart exists for user
    # -----------------------------------------------------
    @staticmethod
    def _get_or_create_cart(db: Session, user_id: int) -> Cart:
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()

        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)

        return cart

    # -----------------------------------------------------
    # Get cart (auto-create if missing)
    # -----------------------------------------------------
    @staticmethod
    def get_cart(db: Session, user_id: int) -> Cart:
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        if not cart:
            cart = CartService._get_or_create_cart(db, user_id)
        return cart

    # -----------------------------------------------------
    # Add item to cart
    # -----------------------------------------------------
    @staticmethod
    def add_item(db: Session, user_id: int, data: CartItemCreate) -> Cart:
        cart = CartService._get_or_create_cart(db, user_id)

        # Validate product
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Validate size
        if data.size not in product.sizes:
            raise HTTPException(
                status_code=400,
                detail=f"Size '{data.size}' not available for this product",
            )

        # Check stock
        stock = product.sizes.get(data.size, 0)
        if stock < 1:
            raise HTTPException(status_code=400, detail="Selected size is out of stock")

        # Check if the item already exists in cart
        existing_item = (
            db.query(CartItem)
            .filter(
                CartItem.cart_id == cart.id,
                CartItem.product_id == data.product_id,
                CartItem.size == data.size,
            )
            .first()
        )

        if existing_item:
            raise HTTPException(
                status_code=400,
                detail="Item already exists in cart. Update quantity instead.",
            )

        # Create new cart item
        item = CartItem(
            cart_id=cart.id,
            product_id=data.product_id,
            size=data.size,
            quantity=data.quantity,
        )

        # Stock validation for quantity
        if item.quantity > stock:
            raise HTTPException(
                status_code=400,
                detail=f"Only {stock} units available for size {data.size}",
            )

        db.add(item)
        db.commit()
        db.refresh(cart)
        return cart

    # -----------------------------------------------------
    # Update item quantity
    # -----------------------------------------------------
    @staticmethod
    def update_item(
            db: Session,
            user_id: int,
            item_id: int,
            data: CartItemUpdate,
    ) -> Cart:
        cart = CartService.get_cart(db, user_id)

        item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id,
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        product = db.query(Product).filter(Product.id == item.product_id).first()

        stock = product.sizes.get(item.size, 0)

        # Validate new quantity
        if data.quantity > stock:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for size {item.size}. Available: {stock}",
            )

        item.quantity = data.quantity

        db.add(item)
        db.commit()
        db.refresh(cart)
        return cart

    # -----------------------------------------------------
    # Remove item from cart
    # -----------------------------------------------------
    @staticmethod
    def remove_item(db: Session, user_id: int, item_id: int) -> Cart:
        cart = CartService.get_cart(db, user_id)

        item = (
            db.query(CartItem)
            .filter(CartItem.id == item_id, CartItem.cart_id == cart.id)
            .first()
        )

        if not item:
            raise HTTPException(status_code=404, detail="Item not found in cart")

        db.delete(item)
        db.commit()
        db.refresh(cart)
        return cart

    # -----------------------------------------------------
    # Clear entire cart
    # -----------------------------------------------------
    @staticmethod
    def clear_cart(db: Session, user_id: int) -> Cart:
        cart = CartService.get_cart(db, user_id)

        for item in list(cart.items):
            db.delete(item)

        db.commit()
        db.refresh(cart)

        return cart
