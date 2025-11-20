from .base import BaseTable, BaseRead
from .links import ProductCollectionLink

# 🛍 Product-related models
from .product import (
    Product,
    ProductCreate,
    ProductUpdate,
    ProductRead,
)
from .product_variant import (
    ProductVariant,
    ProductVariantCreate,
    ProductVariantUpdate,
    ProductVariantRead,
)
from .product_price import (
    ProductPrice,
    ProductPriceCreate,
    ProductPriceUpdate,
    ProductPriceRead,
)
from .product_image import (
    ProductImage,
    ProductImageCreate,
    ProductImageUpdate,
    ProductImageRead,
)
from .product_attribute import (
    ProductAttribute,
    ProductAttributeCreate,
    ProductAttributeUpdate,
    ProductAttributeRead,
)
from .collection import (
    Collection,
    CollectionCreate,
    CollectionUpdate,
    CollectionRead,
)

# 👤 User, Role & Permission models
from .user import (
    User,
    UserCreate,
    UserUpdate,
    UserRead,
    Role,
    RoleRead,
    Permission,
    PermissionRead,
    UserRoleLink,
    RolePermissionLink,
)

# 🛒 Cart models
from .cart import (
    Cart,
    CartItem,
    CartItemCreate,
    CartItemRead,
    CartRead,
)

from .wishlist import (
    Wishlist,
    WishlistItem,
    WishlistItemCreate,
    WishlistItemRead,
    WishlistRead,
)

# 📦 Order models
from .order import (
    Order,
    OrderItem,
    OrderItemCreate,
    OrderItemRead,
    OrderCreate,
    OrderRead,
)

# 🧰 Support / Cases
from .case import (
    SupportCase,
    SupportCaseCreate,
    SupportCaseUpdate,
    SupportCaseRead,
    CaseMessage,
    CaseMessageCreate,
    CaseMessageRead,
)

# 🏠 Address models
from .address import (
    Address,
    AddressCreate,
    AddressUpdate,
    AddressRead,
)

from .coupon import (
    Coupon,
    CouponCreate,
    CouponUpdate,
    CouponRead
)

from .inventory import (
    Inventory
)

__all__ = [
    # 🔹 Base
    "BaseTable",
    "BaseRead",

    # 🔹 Links
    "ProductCollectionLink",
    "UserRoleLink",
    "RolePermissionLink",

    # 🔹 Products
    "Product",
    "ProductCreate",
    "ProductUpdate",
    "ProductRead",

    "ProductVariant",
    "ProductVariantCreate",
    "ProductVariantUpdate",
    "ProductVariantRead",

    "ProductPrice",
    "ProductPriceCreate",
    "ProductPriceUpdate",
    "ProductPriceRead",

    "ProductImage",
    "ProductImageCreate",
    "ProductImageUpdate",
    "ProductImageRead",

    "ProductAttribute",
    "ProductAttributeCreate",
    "ProductAttributeUpdate",
    "ProductAttributeRead",

    "Collection",
    "CollectionCreate",
    "CollectionUpdate",
    "CollectionRead",

    # 🔹 Users & Auth
    "User",
    "UserCreate",
    "UserUpdate",
    "UserRead",
    "Role",
    "RoleRead",
    "Permission",
    "PermissionRead",

    # 🔹 Cart
    "Cart",
    "CartItem",
    "CartItemCreate",
    "CartItemRead",
    "CartRead",

    # 🔹 Wishlist
    "Wishlist",
    "WishlistItem",
    "WishlistItemCreate",
    "WishlistItemRead",
    "WishlistRead",

    # 🔹 Orders
    "Order",
    "OrderItem",
    "OrderItemCreate",
    "OrderItemRead",
    "OrderCreate",
    "OrderRead",

    # 🔹 Support / Cases
    "SupportCase",
    "SupportCaseCreate",
    "SupportCaseUpdate",
    "SupportCaseRead",
    "CaseMessage",
    "CaseMessageCreate",
    "CaseMessageRead",

    # 🔹 Address
    "Address",
    "AddressCreate",
    "AddressUpdate",
    "AddressRead",

    # 🔹 Coupon
    "Coupon",
    "CouponCreate",
    "CouponUpdate",
    "CouponRead",

    # 🔹 Inventory
    "Inventory"
]
