# app/services/wishlist_service.py

from __future__ import annotations
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.wishlist import Wishlist, WishlistItem
from app.models.user import User
from app.models.catalog import Product
from app.schemas.wishlist import WishlistItemCreate


class WishlistService:

    # -----------------------------------------------------
    # Ensure wishlist exists for the user
    # -----------------------------------------------------
    @staticmethod
    def _get_or_create_user_wishlist(db: Session, user_id: int) -> Wishlist:
        wishlist = db.query(Wishlist).filter(Wishlist.user_id == user_id).first()

        if not wishlist:
            wishlist = Wishlist(user_id=user_id)
            db.add(wishlist)
            db.commit()
            db.refresh(wishlist)

        return wishlist

    # -----------------------------------------------------
    # Get Wishlist
    # -----------------------------------------------------
    @staticmethod
    def get_wishlist(db: Session, user_id: int) -> Wishlist:
        wishlist = (
            db.query(Wishlist)
            .filter(Wishlist.user_id == user_id)
            .first()
        )

        if not wishlist:
            # Auto-create empty wishlist
            wishlist = WishlistService._get_or_create_user_wishlist(db, user_id)

        return wishlist

    # -----------------------------------------------------
    # Add product to wishlist
    # -----------------------------------------------------
    @staticmethod
    def add_item(db: Session, user_id: int, data: WishlistItemCreate) -> Wishlist:
        wishlist = WishlistService._get_or_create_user_wishlist(db, user_id)

        # Validate product
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Prevent duplicates
        existing = (
            db.query(WishlistItem)
            .filter(
                WishlistItem.wishlist_id == wishlist.id,
                WishlistItem.product_id == data.product_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(status_code=400, detail="Product already in wishlist")

        # Add item
        item = WishlistItem(
            wishlist_id=wishlist.id,
            product_id=data.product_id,
        )

        db.add(item)
        db.commit()
        db.refresh(wishlist)

        return wishlist

    # -----------------------------------------------------
    # Remove a single product from wishlist
    # -----------------------------------------------------
    @staticmethod
    def remove_item(db: Session, user_id: int, product_id: int) -> Wishlist:
        wishlist = WishlistService.get_wishlist(db, user_id)

        item = (
            db.query(WishlistItem)
            .filter(
                WishlistItem.wishlist_id == wishlist.id,
                WishlistItem.product_id == product_id,
            )
            .first()
        )

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Product not found in wishlist",
            )

        db.delete(item)
        db.commit()
        db.refresh(wishlist)
        return wishlist

    # -----------------------------------------------------
    # Clear the wishlist
    # -----------------------------------------------------
    @staticmethod
    def clear_wishlist(db: Session, user_id: int) -> Wishlist:
        wishlist = WishlistService.get_wishlist(db, user_id)

        for item in list(wishlist.items):
            db.delete(item)

        db.commit()
        db.refresh(wishlist)
        return wishlist
