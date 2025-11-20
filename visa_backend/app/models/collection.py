from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

from .base import BaseTable, BaseRead
from .links import ProductCollectionLink
from .product import Product


class CollectionBase(SQLModel):
    """Base Collection model with shared fields"""
    name: str = Field(index=True, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)


class Collection(CollectionBase, BaseTable, table=True):
    """Collection table model"""
    __tablename__ = "collections"

    slug: str = Field(unique=True, index=True, min_length=1, max_length=100)

    products: List[Product] = Relationship(
        back_populates="collections",
        link_model=ProductCollectionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )


class CollectionCreate(CollectionBase):
    """Schema for creating a collection"""
    product_ids: Optional[List[int]] = Field(default_factory=list)


class CollectionUpdate(SQLModel):
    """Schema for updating a collection (all fields optional)"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    is_active: Optional[bool] = Field(default=None)
    product_ids: Optional[List[int]] = Field(default=None)


class CollectionRead(BaseRead, CollectionBase):
    """Schema for reading a collection"""
    id: int
    slug: str
    is_active: bool
    product_count: int
