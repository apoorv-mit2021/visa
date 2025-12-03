from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

# Store Routes
from app.api.v1.endpoints.store import (
    auth as store_auth,
    collection as store_collection,
    product as store_product,
    address as store_address,
    wishlist as store_wishlist,
    cart as store_cart,
    coupon as store_coupon,
    case as store_case,
    order as store_order
)

# Admin Routes
from app.api.v1.endpoints.admin import (
    auth as admin_auth,
    dashboard as admin_dashboard,
    collection as admin_collection,
    product as admin_product,
    inventory as admin_inventory,
    coupon as admin_coupons,
    client as admin_client,
    staff as admin_staff,
    order as admin_order,
    case as admin_case,
    address as admin_address,
    media as admin_media
)

# Initialize Router
api_router = APIRouter()

# Store Routes
api_router.include_router(store_auth.router, prefix="/store/auth", tags=["Store: Authentication"])
api_router.include_router(store_product.router, prefix="/store/products", tags=["Store: Products"])
api_router.include_router(store_collection.router, prefix="/store/collections", tags=["Store: Collections"])
api_router.include_router(store_address.router, prefix="/store/address", tags=["Store: Addresses"])
api_router.include_router(store_cart.router, prefix="/store/cart", tags=["Store: Cart"])
api_router.include_router(store_case.router, prefix="/store/support-case", tags=["Store: Support Cases"])
api_router.include_router(store_coupon.router, prefix="/store/coupons", tags=["Store: Coupons"])
api_router.include_router(store_order.router, prefix="/store/orders", tags=["Store: Orders"])

api_router.include_router(store_wishlist.router, prefix="/store/wishlist", tags=["Store: Wishlist"])
#
# Admin Routes
api_router.include_router(admin_auth.router, prefix="/admin/auth", tags=["Admin: Authentication"])

api_router.include_router(admin_collection.router, prefix="/admin/collections", tags=["Admin: Collections"])

api_router.include_router(admin_product.router, prefix="/admin/products", tags=["Admin: Products"])

api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["Admin: Dashboard"])

api_router.include_router(admin_inventory.router, prefix="/admin/inventory", tags=["Admin: Inventory"])
api_router.include_router(admin_staff.router, prefix="/admin/staff", tags=["Admin: Staff"])
api_router.include_router(admin_case.router, prefix="/admin/support", tags=["Admin: Support"])
api_router.include_router(admin_client.router, prefix="/admin/client", tags=["Admin: Client"])
api_router.include_router(admin_order.router, prefix="/admin/orders", tags=["Admin: Orders"])
api_router.include_router(admin_coupons.router, prefix="/admin/coupons", tags=["Admin: Coupons"])
api_router.include_router(admin_address.router, prefix="/admin/addresses", tags=["Admin: Addresses"])
api_router.include_router(admin_media.router, prefix="/admin/media", tags=["Media"])


# Health Check
@api_router.get("/health", tags=["Health"])
def health_check():
    try:
        # SQLAlchemy 2.0 requires text() for raw SQL
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": "v1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "ecommerce-api",
    }
