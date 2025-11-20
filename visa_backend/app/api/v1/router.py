from datetime import datetime, timezone
from fastapi import APIRouter
from app.db import engine

# Store Routes
from app.api.v1.endpoints.store import (
    auth as store_auth,
    product as store_product,
    collection as store_collection,
    address as store_address,
    cart as store_cart,
    wishlist as store_wishlist
)

# Admin Routes
from app.api.v1.endpoints.admin import (
    auth as admin_auth,
    collection as admin_collection,
    dashboard as admin_dashboard,
    inventory as admin_inventory,
    product as admin_product,
    variant as admin_variant,
    staff as admin_staff,
    client as admin_client,
    coupon as admin_coupons,
    case as admin_case,
    order as admin_order,
    address as admin_address
)

# Initialize Router
api_router = APIRouter()

# Store Routes
api_router.include_router(store_auth.router, prefix="/store/auth", tags=["Store: Authentication"])
api_router.include_router(store_product.router, prefix="/store/products", tags=["Store: Products"])
api_router.include_router(store_collection.router, prefix="/store/collections", tags=["Store: Collections"])
# api_router.include_router(store_address.router, prefix="/store/addresses", tags=["Store: Addresses"])
# api_router.include_router(store_cart.router, prefix="/store/cart", tags=["Store: Cart"])
# api_router.include_router(store_wishlist.router, prefix="/store/wishlist", tags=["Store: Wishlist"])

# Admin Routes
api_router.include_router(admin_auth.router, prefix="/admin/auth", tags=["Admin: Authentication"])
api_router.include_router(admin_collection.router, prefix="/admin/collections", tags=["Admin: Collections"])
# api_router.include_router(admin_dashboard.router, prefix="/admin/dashboard", tags=["Admin: Dashboard"])
api_router.include_router(admin_product.router, prefix="/admin/products", tags=["Admin: Products"])

api_router.include_router(admin_inventory.router, prefix="/admin/inventory", tags=["Admin: Inventory"])
api_router.include_router(admin_staff.router, prefix="/admin/staff", tags=["Admin: Staff"])
# api_router.include_router(admin_case.router, prefix="/admin/support", tags=["Admin: Support"])
api_router.include_router(admin_client.router, prefix="/admin/client", tags=["Admin: Client"])
# api_router.include_router(admin_order.router, prefix="/admin/orders", tags=["Admin: Orders"])
api_router.include_router(admin_coupons.router, prefix="/admin/coupons", tags=["Admin: Coupons"])


# api_router.include_router(admin_address.router, prefix="/admin/addresses", tags=["Admin: Addresses"])


# Health Check
@api_router.get("/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": "v1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "auri-api",
    }
