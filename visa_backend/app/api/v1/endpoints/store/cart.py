# app/api/v1/endpoints/store/cart.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.models.user import User
from app.schemas.cart import (
    CartRead,
    CartItemCreate,
    CartItemUpdate,
)
from app.services.cart_service import CartService

router = APIRouter()


# ---------------------------------------------------------
# GET MY CART
# ---------------------------------------------------------
@router.get("/", response_model=CartRead)
def get_my_cart(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    cart = CartService.get_cart(db, current_user.id)
    return CartRead.model_validate(cart)


# ---------------------------------------------------------
# ADD ITEM TO CART
# ---------------------------------------------------------
@router.post("/items", response_model=CartRead, status_code=status.HTTP_201_CREATED)
def add_cart_item(
        payload: CartItemCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    cart = CartService.add_item(db, current_user.id, payload)
    return CartRead.model_validate(cart)


# ---------------------------------------------------------
# UPDATE CART ITEM QUANTITY
# ---------------------------------------------------------
@router.put("/items/{item_id}", response_model=CartRead)
def update_cart_item(
        item_id: int,
        payload: CartItemUpdate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    cart = CartService.update_item(
        db=db,
        user_id=current_user.id,
        item_id=item_id,
        data=payload,
    )
    return CartRead.model_validate(cart)


# ---------------------------------------------------------
# REMOVE A CART ITEM
# ---------------------------------------------------------
@router.delete(
    "/items/{item_id}", status_code=status.HTTP_200_OK, response_model=CartRead
)
def remove_cart_item(
        item_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    cart = CartService.remove_item(db, current_user.id, item_id)
    return CartRead.model_validate(cart)


# ---------------------------------------------------------
# CLEAR CART
# ---------------------------------------------------------
@router.delete("/", status_code=status.HTTP_200_OK, response_model=CartRead)
def clear_my_cart(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    cart = CartService.clear_cart(db, current_user.id)
    return CartRead.model_validate(cart)
