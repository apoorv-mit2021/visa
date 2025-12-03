# app/api/v1/endpoints/store/wishlist.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.models.user import User
from app.schemas.wishlist import (
    WishlistRead,
    WishlistItemCreate,
)
from app.services.wishlist_service import WishlistService

router = APIRouter()


# ---------------------------------------------------------
# GET MY WISHLIST
# ---------------------------------------------------------
@router.get("/", response_model=WishlistRead)
def get_my_wishlist(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    wishlist = WishlistService.get_wishlist(db, current_user.id)
    return WishlistRead.model_validate(wishlist)


# ---------------------------------------------------------
# ADD PRODUCT TO WISHLIST
# ---------------------------------------------------------
@router.post(
    "/items",
    response_model=WishlistRead,
    status_code=status.HTTP_201_CREATED,
)
def add_to_wishlist(
        payload: WishlistItemCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    wishlist = WishlistService.add_item(db, current_user.id, payload)
    return WishlistRead.model_validate(wishlist)


# ---------------------------------------------------------
# REMOVE A PRODUCT FROM WISHLIST
# ---------------------------------------------------------
@router.delete(
    "/items/{product_id}",
    response_model=WishlistRead,
    status_code=status.HTTP_200_OK,
)
def remove_from_wishlist(
        product_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    wishlist = WishlistService.remove_item(db, current_user.id, product_id)
    return WishlistRead.model_validate(wishlist)


# ---------------------------------------------------------
# CLEAR ENTIRE WISHLIST
# ---------------------------------------------------------
@router.delete(
    "/", response_model=WishlistRead, status_code=status.HTTP_200_OK
)
def clear_my_wishlist(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    wishlist = WishlistService.clear_wishlist(db, current_user.id)
    return WishlistRead.model_validate(wishlist)
