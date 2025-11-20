from typing import Optional, List
from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from .base import BaseTable, BaseRead

if TYPE_CHECKING:
    from app.models.inventory import Inventory
    from app.models.product import Product
    from app.models.product_price import ProductPrice, ProductPriceRead
    from app.models.product_image import ProductImage, ProductImageRead
    from app.models.product_attribute import ProductAttribute, ProductAttributeRead


# -----------------------------------------------------
# BASE MODEL
# -----------------------------------------------------
class ProductVariantBase(SQLModel):
    """Base fields shared across ProductVariant schemas."""
    sku: str = Field(index=True, min_length=1, max_length=50)
    slug: Optional[str] = Field(default=None, index=True, unique=True, max_length=150)
    name: Optional[str] = Field(default=None, max_length=200)
    stock_quantity: int = Field(default=0, ge=0)
    is_default: bool = Field(default=False, index=True)
    is_active: bool = Field(default=True, index=True)

    # Optional logistical fields
    weight: Optional[float] = Field(default=None, description="Weight in grams")
    length: Optional[float] = Field(default=None, description="Length in cm")
    width: Optional[float] = Field(default=None, description="Width in cm")
    height: Optional[float] = Field(default=None, description="Height in cm")


# -----------------------------------------------------
# DATABASE MODEL
# -----------------------------------------------------
class ProductVariant(ProductVariantBase, BaseTable, table=True):
    """Represents a sellable SKU variant of a Product."""
    __tablename__ = "product_variants"

    product_id: int = Field(foreign_key="products.id", index=True)

    # Relationships
    product: "Product" = Relationship(back_populates="variants")

    prices: List["ProductPrice"] = Relationship(
        back_populates="variant",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )

    images: List["ProductImage"] = Relationship(
        back_populates="variant",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )

    attributes: List["ProductAttribute"] = Relationship(
        back_populates="variant",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "lazy": "selectin"},
    )

    inventory: List["Inventory"] = Relationship(
        back_populates="product_variant",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"},
    )


# -----------------------------------------------------
# SCHEMAS
# -----------------------------------------------------
class ProductVariantCreate(ProductVariantBase):
    """Schema for creating a product variant."""
    pass


class ProductVariantUpdate(SQLModel):
    """Schema for updating a product variant."""
    sku: Optional[str] = None
    slug: Optional[str] = None
    name: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class ProductVariantRead(ProductVariantBase, BaseRead):
    """Read schema for returning a product variant with nested relationships."""
    id: int
    prices: Optional[List["ProductPriceRead"]] = None
    images: Optional[List["ProductImageRead"]] = None
    attributes: Optional[List["ProductAttributeRead"]] = None
