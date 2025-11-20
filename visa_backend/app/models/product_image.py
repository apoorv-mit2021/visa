from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead


# -----------------------------------------------------
# BASE MODEL
# -----------------------------------------------------
class ProductImageBase(SQLModel):
    """Base fields shared across product image schemas."""
    # Note: We store a URL path served by FastAPI StaticFiles mounted at /media
    # Example: "/media/products/variant_12/abc123.webp". Clients should prefix
    # with the API base URL when rendering.
    image_url: str = Field(
        max_length=500,
        description="URL path to the image served by this API (mounted under /media)",
    )
    alt_text: Optional[str] = Field(default=None, max_length=300, description="Alternative text for accessibility/SEO")
    display_order: int = Field(default=0, description="Order of display in product gallery")
    is_primary: bool = Field(default=False, description="Marks this image as the primary one")
    is_active: bool = Field(default=True, description="Flag to disable image without deleting")


# -----------------------------------------------------
# DATABASE MODEL
# -----------------------------------------------------
class ProductImage(ProductImageBase, BaseTable, table=True):
    """Stores multiple images per product variant."""
    __tablename__ = "product_images"

    variant_id: int = Field(foreign_key="product_variants.id", index=True)

    variant: "ProductVariant" = Relationship(back_populates="images")


# -----------------------------------------------------
# SCHEMAS
# -----------------------------------------------------
class ProductImageCreate(ProductImageBase):
    """Schema for creating a product image."""
    pass


class ProductImageUpdate(SQLModel):
    """Schema for updating a product image."""
    image_url: Optional[str] = None
    alt_text: Optional[str] = None
    display_order: Optional[int] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductImageRead(ProductImageBase, BaseRead):
    """Schema for returning a product image."""
    id: int
    variant_id: int


# ✅ Import at end to avoid circular imports
from app.models.product_variant import ProductVariant
