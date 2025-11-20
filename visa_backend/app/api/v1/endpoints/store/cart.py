from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import User, Cart, CartItem, CartItemCreate, CartRead, ProductVariant
from app.core.deps import get_current_user

router = APIRouter()


# -----------------------------------------------------
# 🧾 GET CART
# -----------------------------------------------------
@router.get("/", response_model=CartRead)
def get_cart(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Get or create the current user's cart"""
    cart = session.exec(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        session.add(cart)
        session.commit()
        session.refresh(cart)
    return cart


# -----------------------------------------------------
# ➕ ADD TO CART
# -----------------------------------------------------
@router.post("/add", response_model=CartRead, status_code=status.HTTP_201_CREATED)
def add_to_cart(
        item: CartItemCreate,
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Add or update a variant in the user's cart"""
    cart = session.exec(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        session.add(cart)
        session.commit()
        session.refresh(cart)

    variant = session.get(ProductVariant, item.variant_id)
    if not variant or not variant.is_active:
        raise HTTPException(status_code=404, detail="Variant not found or inactive")

    existing_item = session.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.id, CartItem.variant_id == item.variant_id
        )
    ).first()

    if existing_item:
        existing_item.quantity += item.quantity
    else:
        session.add(CartItem(cart_id=cart.id, variant_id=item.variant_id, quantity=item.quantity))

    session.commit()
    session.refresh(cart)
    return cart


# -----------------------------------------------------
# ❌ REMOVE ITEM
# -----------------------------------------------------
@router.delete("/remove/{variant_id}", response_model=CartRead)
def remove_item(
        variant_id: int,
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Remove a specific variant from the cart"""
    cart = session.exec(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item = session.exec(
        select(CartItem).where(
            CartItem.cart_id == cart.id, CartItem.variant_id == variant_id
        )
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    session.delete(item)
    session.commit()
    session.refresh(cart)
    return cart


# -----------------------------------------------------
# 🧹 CLEAR CART
# -----------------------------------------------------
@router.delete("/clear", response_model=CartRead)
def clear_cart(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Clear all items from the user's cart"""
    cart = session.exec(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    for item in cart.items:
        session.delete(item)
    session.commit()
    session.refresh(cart)
    return cart
