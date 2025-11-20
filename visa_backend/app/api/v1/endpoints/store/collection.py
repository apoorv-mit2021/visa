from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.core.deps import get_session
from app.models import Collection
from app.utils.currency import get_currency_from_request
from app.schemas.collection import (
    map_store_collection_list,
    map_store_collection_product,
    map_store_collection_detail,
)
from app.utils.product_utils import get_variant_price

router = APIRouter()


# Store API: Get all active collections
@router.get("/", summary="Get all active collections for the store")
def list_store_collections(
        session: Session = Depends(get_session),
        limit: int = Query(100, ge=1, le=200),
        offset: int = Query(0, ge=0),
):
    query = (
        select(Collection)
        .where(Collection.is_active == True)
        .order_by(Collection.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    collections = session.exec(query).all()

    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "description": c.description,
            "product_count": len(c.products or []),
        }
        for c in collections
    ]


# Store API: Get all active products for a specific collection
@router.get("/{slug}", summary="Get all active products in a collection")
def get_collection_products(
        slug: str,
        session: Session = Depends(get_session),
        currency: str = Depends(get_currency_from_request),
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
):
    # Fetch collection by slug
    collection = session.exec(
        select(Collection).where(Collection.slug == slug)
    ).first()

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Filter only active products
    products = [p for p in collection.products if p.is_active]

    # Apply pagination manually since products is a list
    paginated_products = products[offset: offset + limit]

    response_products = []

    for product in paginated_products:

        # 1️⃣ Identify default variant
        variant = next((v for v in product.variants if v.is_default), None)

        # Fallback to the first variant if none is marked default
        if not variant and product.variants:
            variant = product.variants[0]

        # Skip the product if NO variants exist
        if not variant:
            continue

        # 2️⃣ Calculate price for currency
        price = get_variant_price(variant, currency)

        # 3️⃣ Main image
        image_url = variant.images[0].image_url if variant.images else None

        response_products.append({
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "default_variant": {
                "id": variant.id,
                "sku": variant.sku,
                "name": variant.name,
                "price": price,
                "currency": currency,
                "image_url": image_url,
            },
        })

    return {
        "collection": {
            "id": collection.id,
            "name": collection.name,
            "slug": collection.slug,
        },
        "products": response_products,
        "total_products": len(products),
        "returned": len(response_products),
        "limit": limit,
        "offset": offset,
    }
