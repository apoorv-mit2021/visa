# backend/app/api/v1/endpoints/store/product.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.deps import get_session
from app.models import Product
from app.utils.currency import get_currency_from_request

# NEW: Import schemas + mapping utilities
from app.schemas.product import (
    StoreProductListSchema,
    StoreProductDetailSchema,
    map_store_product_list,
    map_store_variant_detail,
    map_store_product_detail,
)

router = APIRouter()


# ---------------------------------------------------
# 🛒 GET /api/v1/store/products  → PRODUCT LIST
# ---------------------------------------------------
@router.get(
    "/",
    response_model=List[StoreProductListSchema],
    summary="List active products with default variant"
)
def list_products(
        session: Session = Depends(get_session),
        currency: str = Depends(get_currency_from_request),
        search: Optional[str] = Query(None),
        category: Optional[str] = Query(None),
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
):
    query = select(Product).where(Product.is_active == True)

    if category:
        query = query.where(Product.category == category)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    query = query.offset(offset).limit(limit)
    products = session.exec(query).all()

    response: List[StoreProductListSchema] = []

    for product in products:
        # Select default or first variant
        variant = next((v for v in product.variants if v.is_default), None)
        if not variant and product.variants:
            variant = product.variants[0]
        if not variant:
            continue

        # Price + image
        price = None
        image_url = None

        if variant.prices:
            price_obj = next((p for p in variant.prices if p.currency == currency), None)
            price = float(price_obj.price) if price_obj else None

        if variant.images:
            # Prefer primary and active image; then by display order
            active_sorted = sorted(
                [img for img in variant.images if img.is_active],
                key=lambda i: (not i.is_primary, i.display_order)
            )
            if active_sorted:
                image_url = active_sorted[0].image_url

        # Use schema mapper
        response.append(
            map_store_product_list(
                product=product,
                default_variant=variant,
                price=price,
                currency=currency,
                image_url=image_url,
            )
        )

    return response


# ---------------------------------------------------
# 📦 GET /api/v1/store/products/{product_id} → PRODUCT DETAILS
# ---------------------------------------------------
@router.get(
    "/{product_id}",
    response_model=StoreProductDetailSchema,
    summary="Get single product with variants & attributes"
)
def get_product_detail(
        product_id: int,
        session: Session = Depends(get_session),
        currency: str = Depends(get_currency_from_request),
):
    product = session.get(Product, product_id)

    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")

    variant_schemas = []

    for variant in product.variants:
        # Attributes → {"Color": ["Black"], "Size": ["M"]}
        attrs = {}
        for a in variant.attributes:
            attrs.setdefault(a.name, set()).add(a.value)
        attrs = {k: list(v) for k, v in attrs.items()}

        # Images (active only, sorted)
        images = [
            i.image_url for i in sorted(
                [img for img in variant.images if img.is_active],
                key=lambda x: (not x.is_primary, x.display_order)
            )
        ]

        # Price
        price = None
        price_obj = next((p for p in variant.prices if p.currency == currency), None)
        if price_obj:
            price = float(price_obj.price)

        # Use schema mapper
        variant_schemas.append(
            map_store_variant_detail(
                variant=variant,
                attributes=attrs,
                images=images,
                price=price,
                currency=currency
            )
        )

    return map_store_product_detail(product, variant_schemas)
