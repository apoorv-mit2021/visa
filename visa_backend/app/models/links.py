# app/models/links.py

from typing import Optional
from sqlmodel import SQLModel, Field


class ProductCollectionLink(SQLModel, table=True):
    """Link table for many-to-many relationship between Products and Collections"""
    __tablename__ = "product_collection_link"

    product_id: Optional[int] = Field(
        default=None, foreign_key="products.id", primary_key=True
    )
    collection_id: Optional[int] = Field(
        default=None, foreign_key="collections.id", primary_key=True
    )
