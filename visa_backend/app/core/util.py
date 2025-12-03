from datetime import datetime, timezone
from app.models import Product


def utcnow() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def flatten_product(product: Product) -> dict:
    variants = product.variants or []
    variant_data = []
    for v in variants:
        prices = [
            {
                "currency": p.currency,
                "price": p.price,
            }
            for p in (v.prices or [])
        ]
        attributes = [
            {"name": a.name, "value": a.value}
            for a in (v.attributes or [])
        ]
        images = [
            {
                "url": img.image_url,
                "alt": img.alt_text,
                "is_primary": img.is_primary,
            }
            for img in (v.images or [])
        ]
        variant_data.append(
            {
                "id": v.id,
                "sku": v.sku,
                "name": v.name,
                "stock_quantity": v.stock_quantity,
                "is_default": v.is_default,
                "prices": prices,
                "attributes": attributes,
                "images": images,
            }
        )

    all_images = [
        img
        for v in variants
        for img in v.images or []
    ]
    unique_gallery = [
        {
            "url": i.image_url,
            "alt": i.alt_text,
            "is_primary": i.is_primary,
        }
        for i in all_images
    ]

    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "sku": product.sku,
        "description": product.description,
        "is_active": product.is_active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
        "variants": variant_data,
        "gallery": unique_gallery,
    }
