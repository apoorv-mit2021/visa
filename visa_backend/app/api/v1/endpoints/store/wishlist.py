from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import User, Wishlist, WishlistItem, WishlistItemCreate, WishlistRead, ProductVariant
from app.core.deps import get_current_user

router = APIRouter()


# -----------------------------------------------------
# 💖 GET WISHLIST
# -----------------------------------------------------
@router.get("/", response_model=WishlistRead)
def get_wishlist(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Get or create the current user's wishlist"""
    wishlist = session.exec(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        session.add(wishlist)
        session.commit()
        session.refresh(wishlist)
    return wishlist


# -----------------------------------------------------
# ➕ ADD TO WISHLIST
# -----------------------------------------------------
@router.post("/add", response_model=WishlistRead, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
        item: WishlistItemCreate,
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Add a variant to the wishlist"""
    wishlist = session.exec(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        session.add(wishlist)
        session.commit()
        session.refresh(wishlist)

    variant = session.get(ProductVariant, item.variant_id)
    if not variant or not variant.is_active:
        raise HTTPException(status_code=404, detail="Variant not found or inactive")

    existing = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id, WishlistItem.variant_id == item.variant_id
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Item already in wishlist")

    session.add(WishlistItem(wishlist_id=wishlist.id, variant_id=item.variant_id))
    session.commit()
    session.refresh(wishlist)
    return wishlist


# -----------------------------------------------------
# ❌ REMOVE ITEM
# -----------------------------------------------------
@router.delete("/remove/{variant_id}", response_model=WishlistRead)
def remove_item(
        variant_id: int,
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Remove an item from the user's wishlist"""
    wishlist = session.exec(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id, WishlistItem.variant_id == variant_id
        )
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found in wishlist")

    session.delete(item)
    session.commit()
    session.refresh(wishlist)
    return wishlist


# -----------------------------------------------------
# 🧹 CLEAR WISHLIST
# -----------------------------------------------------
@router.delete("/clear", response_model=WishlistRead)
def clear_wishlist(
        current_user: User = Depends(get_current_user),
        session: Session = Depends(get_session),
):
    """Remove all items from the user's wishlist"""
    wishlist = session.exec(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    for item in wishlist.items:
        session.delete(item)
    session.commit()
    session.refresh(wishlist)
    return wishlist
