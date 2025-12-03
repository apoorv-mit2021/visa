# # app/models/__init__.py

from app.models.base import Base

# User + Role
from app.models.user import User, Role

# Address
from app.models.address import Address

# Catalog (Product + Collection)
from app.models.catalog import Product, Collection, product_collection_table

# Cart & Wishlist
from app.models.cart import Cart, CartItem
from app.models.wishlist import Wishlist, WishlistItem

# Orders
from app.models.order import Order, OrderItem

# Support Case
from app.models.case import SupportCase, CaseMessage

# Inventory
from app.models.inventory import Inventory

# Coupons
from app.models.coupon import Coupon

__all__ = [
    "Base",

    # User & Role
    "User",
    "Role",

    # Address
    "Address",

    # Catalog
    "Product",
    "Collection",
    "product_collection_table",

    # Cart & Wishlist
    "Cart",
    "CartItem",
    "Wishlist",
    "WishlistItem",

    # Orders
    "Order",
    "OrderItem",

    # Support Cases
    "SupportCase",
    "CaseMessage",

    # Inventory
    "Inventory",

    # Coupons
    "Coupon",
]
