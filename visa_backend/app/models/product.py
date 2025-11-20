from typing import Optional, List

from sqlmodel import SQLModel, Field, Relationship

from .base import BaseTable, BaseRead
from .links import ProductCollectionLink


class ProductBase(SQLModel):
    """Base Product model with shared fields"""
    name: str = Field(index=True, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: str = Field(index=True, min_length=1, max_length=100)
    slug: str = Field(index=True, unique=True, min_length=1, max_length=150)


class Product(ProductBase, BaseTable, table=True):
    """Product table model"""
    __tablename__ = "products"

    # Relationship to variants (SKU-specific)
    variants: List["ProductVariant"] = Relationship(
        back_populates="product",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "cascade": "all, delete-orphan"
        },
    )

    # Relationship to collections (many-to-many)
    collections: List["Collection"] = Relationship(
        back_populates="products",
        link_model=ProductCollectionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class ProductCreate(ProductBase):
    pass


class ProductUpdate(SQLModel):
    """Schema for updating existing products"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None


class ProductRead(ProductBase, BaseRead):
    id: int
    is_active: bool


# ✅ Import after definitions to break circular schema import issues
from app.models.product_variant import ProductVariant
from app.models.collection import Collection
