from typing import List, Optional
from pydantic import BaseModel

from app.schemas.product import StoreProductVariantSchema


# -----------------------------------------------------
# Store Collection List Schema
# -----------------------------------------------------
class StoreCollectionListSchema(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    product_count: int


# -----------------------------------------------------
# Store Collection - Product Item Schema
# -----------------------------------------------------
class StoreCollectionProductSchema(BaseModel):
    id: int
    name: str
    category: str
    default_variant: StoreProductVariantSchema


# -----------------------------------------------------
# Store Collection Detail Schema
# -----------------------------------------------------
class StoreCollectionDetailSchema(BaseModel):
    collection: StoreCollectionListSchema
    products: List[StoreCollectionProductSchema]
    total_products: int
    returned: int
    limit: int
    offset: int


def map_store_collection_list(c):
    return StoreCollectionListSchema(
        id=c.id,
        name=c.name,
        slug=c.slug,
        description=c.description,
        product_count=len(c.products or [])
    )


def map_store_collection_product(product, variant, price, currency, image_url):
    return StoreCollectionProductSchema(
        id=product.id,
        name=product.name,
        category=product.category,
        default_variant=StoreProductVariantSchema(
            id=variant.id,
            sku=variant.sku,
            name=variant.name,
            price=price,
            currency=currency,
            image_url=image_url,
        )
    )


def map_store_collection_detail(collection, products, total, returned, limit, offset):
    return StoreCollectionDetailSchema(
        collection=map_store_collection_list(collection),
        products=products,
        total_products=total,
        returned=returned,
        limit=limit,
        offset=offset,
    )
