from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead


# -----------------------------------------------------
# BASE MODEL
# -----------------------------------------------------
class ProductAttributeBase(SQLModel):
    """Base fields shared across attribute schemas."""
    name: str = Field(index=True, min_length=1, max_length=100, description="Attribute name, e.g., Color, Size")
    value: str = Field(min_length=1, max_length=200, description="Attribute value, e.g., Red, Medium")
    is_active: bool = Field(default=True, description="Flag to disable this attribute if needed")


# -----------------------------------------------------
# DATABASE MODEL
# -----------------------------------------------------
class ProductAttribute(ProductAttributeBase, BaseTable, table=True):
    """Key-value attributes for a product variant (e.g., Color, Size, Material)."""
    __tablename__ = "product_attributes"

    variant_id: int = Field(foreign_key="product_variants.id", index=True)

    variant: "ProductVariant" = Relationship(back_populates="attributes")


# -----------------------------------------------------
# SCHEMAS
# -----------------------------------------------------
class ProductAttributeCreate(ProductAttributeBase):
    """Schema for creating a product attribute."""
    pass


class ProductAttributeUpdate(SQLModel):
    """Schema for updating a product attribute."""
    name: Optional[str] = None
    value: Optional[str] = None
    is_active: Optional[bool] = None


class ProductAttributeRead(ProductAttributeBase, BaseRead):
    """Schema for returning a product attribute."""
    id: int
    variant_id: int


# ✅ Import at end to avoid circular imports
from app.models.product_variant import ProductVariant
