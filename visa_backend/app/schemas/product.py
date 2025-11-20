from typing import List, Optional, Dict
from pydantic import BaseModel
from decimal import Decimal
from app.core.config import ALLOWED_CURRENCIES

from pydantic import field_validator

from app.models import ProductImage


# -----------------------------------------------------
# 🟢 STORE SCHEMAS
# -----------------------------------------------------

class StoreProductVariantSchema(BaseModel):
    id: int
    sku: str
    name: Optional[str]
    price: Optional[float]
    currency: str
    image_url: Optional[str]


class StoreProductListSchema(BaseModel):
    id: int
    name: str
    category: str
    default_variant: StoreProductVariantSchema


class StoreVariantDetailSchema(BaseModel):
    id: int
    sku: str
    name: Optional[str]
    stock_quantity: int
    attributes: Dict[str, List[str]]
    images: List[str]
    price: Optional[float]
    currency: str


class StoreProductDetailSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    variants: List[StoreVariantDetailSchema]


# -----------------------------------------------------
# 🔵 ADMIN SCHEMAS
# -----------------------------------------------------

class AdminProductMetricsSchema(BaseModel):
    total_products: int
    active_products: int
    total_variants: int
    low_stock: int


class AdminProductPriceSchema(BaseModel):
    id: int
    currency: str
    price: float
    is_active: bool


class AdminProductImageSchema(BaseModel):
    id: int
    image_url: str
    alt_text: Optional[str]
    display_order: int
    is_primary: bool
    is_active: bool


class AdminProductAttributeSchema(BaseModel):
    id: int
    name: str
    value: str
    is_active: bool


class AdminProductVariantSchema(BaseModel):
    id: int
    sku: str
    slug: Optional[str]
    name: Optional[str]
    stock_quantity: int
    is_default: bool
    is_active: bool
    weight: Optional[float]
    length: Optional[float]
    width: Optional[float]
    height: Optional[float]

    prices: List[AdminProductPriceSchema]
    images: List[AdminProductImageSchema]
    attributes: List[AdminProductAttributeSchema]


class AdminProductListSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    slug: str
    is_active: bool
    created_at: str
    updated_at: Optional[str]
    variants_count: int


class AdminProductDetailSchema(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    slug: str
    is_active: bool
    created_at: str
    updated_at: Optional[str]

    variants: List[AdminProductVariantSchema]


# -----------------------------------------------------
# ✏️ CREATE / UPDATE SCHEMAS
# -----------------------------------------------------

# ----- Prices -----
class PriceCreate(BaseModel):
    currency: str
    price: Decimal
    is_active: Optional[bool] = True

    @field_validator("currency")
    def validate_currency(cls, v):
        if v not in ALLOWED_CURRENCIES:
            raise ValueError(f"Unsupported currency '{v}'. Allowed: {ALLOWED_CURRENCIES}")
        return v


class PriceUpdate(BaseModel):
    id: Optional[int] = None
    currency: Optional[str] = None
    price: Optional[Decimal] = None
    is_active: Optional[bool] = None

    @field_validator("currency")
    def validate_currency(cls, v):
        if v and v not in ALLOWED_CURRENCIES:
            raise ValueError(f"Unsupported currency '{v}'. Allowed: {ALLOWED_CURRENCIES}")
        return v


# ----- Images -----
class ImageCreate(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    display_order: Optional[int] = 0
    is_primary: Optional[bool] = False
    is_active: Optional[bool] = True


class ImageUpdate(BaseModel):
    id: Optional[int] = None
    image_url: Optional[str] = None
    alt_text: Optional[str] = None
    display_order: Optional[int] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None


# ----- Attributes -----
class AttributeCreate(BaseModel):
    name: str
    value: str
    is_active: Optional[bool] = True


class AttributeUpdate(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    value: Optional[str] = None
    is_active: Optional[bool] = None


# ----- Variant Create/Update -----
class ProductVariantCreate(BaseModel):
    sku: str
    name: Optional[str] = None
    stock_quantity: int
    is_default: bool = False
    is_active: bool = True
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

    prices: Optional[List[PriceCreate]] = []
    # images: Optional[List[ImageCreate]] = []
    attributes: Optional[List[AttributeCreate]] = []


class ProductVariantUpdate(BaseModel):
    id: Optional[int] = None
    sku: Optional[str] = None
    name: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

    prices: Optional[List[PriceUpdate]] = None
    # images: Optional[List[ImageUpdate]] = None
    attributes: Optional[List[AttributeUpdate]] = None


# ----- Product Create / Update -----
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str

    variants: List[ProductVariantCreate]


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

    variants: Optional[List[ProductVariantUpdate]] = None


# -----------------------------------------------------
# ⚙️ MAPPING UTILITIES
# -----------------------------------------------------

def map_admin_variant(variant):
    return AdminProductVariantSchema(
        id=variant.id,
        sku=variant.sku,
        slug=variant.slug,
        name=variant.name,
        stock_quantity=variant.stock_quantity,
        is_default=variant.is_default,
        is_active=variant.is_active,
        weight=variant.weight,
        length=variant.length,
        width=variant.width,
        height=variant.height,
        prices=[
            AdminProductPriceSchema(
                id=p.id,
                currency=p.currency,
                price=float(p.price),
                is_active=p.is_active,
            )
            for p in variant.prices
        ],
        images=[
            AdminProductImageSchema(
                id=i.id,
                image_url=i.image_url,
                alt_text=i.alt_text,
                display_order=i.display_order,
                is_primary=i.is_primary,
                is_active=i.is_active,
            )
            for i in sorted(variant.images, key=lambda x: x.display_order)
        ],
        attributes=[
            AdminProductAttributeSchema(
                id=a.id,
                name=a.name,
                value=a.value,
                is_active=a.is_active,
            )
            for a in variant.attributes
        ],
    )


def map_admin_product_list(product):
    return AdminProductListSchema(
        id=product.id,
        name=product.name,
        description=product.description,
        category=product.category,
        slug=product.slug,
        is_active=product.is_active,
        created_at=product.created_at.isoformat(),
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
        variants_count=len(product.variants)
    )


def map_admin_product_detail(product):
    return AdminProductDetailSchema(
        id=product.id,
        name=product.name,
        description=product.description,
        category=product.category,
        slug=product.slug,
        is_active=product.is_active,
        created_at=product.created_at.isoformat(),
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
        variants=[map_admin_variant(v) for v in product.variants],
    )


def map_store_product_list(
        product,
        default_variant,
        price: Optional[float],
        currency: str,
        image_url: Optional[str],
) -> StoreProductListSchema:
    return StoreProductListSchema(
        id=product.id,
        name=product.name,
        category=product.category,
        default_variant=StoreProductVariantSchema(
            id=default_variant.id,
            sku=default_variant.sku,
            name=default_variant.name,
            price=price,
            currency=currency,
            image_url=image_url,
        ),
    )


def map_store_variant_detail(
        variant,
        attributes: Dict[str, List[str]],
        images: List[str],
        price: Optional[float],
        currency: str,
) -> StoreVariantDetailSchema:
    return StoreVariantDetailSchema(
        id=variant.id,
        sku=variant.sku,
        name=variant.name,
        stock_quantity=variant.stock_quantity,
        attributes=attributes,
        images=images,
        price=price,
        currency=currency,
    )


def map_store_product_detail(
        product,
        variants: List[StoreVariantDetailSchema],
) -> StoreProductDetailSchema:
    return StoreProductDetailSchema(
        id=product.id,
        name=product.name,
        description=product.description,
        category=product.category,
        variants=variants,
    )


def map_admin_product_image(img: ProductImage):
    return AdminProductImageSchema(
        id=img.id,
        image_url=img.image_url,
        alt_text=img.alt_text,
        display_order=img.display_order,
        is_primary=img.is_primary,
        is_active=img.is_active,
    )
