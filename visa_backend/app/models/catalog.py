# app/models/catalog.py

from __future__ import annotations

from enum import Enum
from typing import List

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Table,
    ForeignKey,
    JSON,
    Float,
)
from sqlalchemy.orm import relationship, Mapped

from app.models.base import Base, BaseTableMixin


# -----------------------------------------------------
# CATEGORY ENUM
# -----------------------------------------------------
class ProductCategory(str, Enum):
    RINGS = "Rings"
    NECKLACES = "Necklaces"
    BRACELETS = "Bracelets"
    EARRINGS = "Earrings"
    PENDANTS = "Pendants"
    BANGLES = "Bangles"
    CHAINS = "Chains"
    ANKLETS = "Anklets"
    WEDDING = "Wedding"
    ENGAGEMENT = "Engagement"
    LUXURY = "Luxury"
    CUSTOM = "Custom"


# -----------------------------------------------------
# MANY-TO-MANY ASSOCIATION TABLE
# -----------------------------------------------------
product_collection_table = Table(
    "product_collection_link",
    Base.metadata,
    Column("product_id", ForeignKey("products.id"), primary_key=True),
    Column("collection_id", ForeignKey("collections.id"), primary_key=True),
)


# -----------------------------------------------------
# COLLECTION MODEL
# -----------------------------------------------------
class Collection(Base, BaseTableMixin):
    __tablename__ = "collections"

    name = Column(String(200), nullable=False, index=True)
    description = Column(String(1000))
    slug = Column(String(150), unique=True, nullable=False, index=True)
    show_on_landing = Column(Boolean, default=False, nullable=False)

    products: Mapped[List["Product"]] = relationship(
        secondary=product_collection_table,
        lazy="selectin",
    )

    @property
    def product_ids(self) -> list[int]:
        return [p.id for p in self.products]


# -----------------------------------------------------
# PRODUCT MODEL
# -----------------------------------------------------
class Product(Base, BaseTableMixin):
    __tablename__ = "products"

    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(String(2000))
    rating = Column(Float, default=0.0)

    price = Column(Float, nullable=False)
    currency = Column(String(5), nullable=False, default="CAD")

    category = Column(String(50), nullable=False)

    sizes = Column(JSON, default=dict)
    care_instructions = Column(JSON, default=list)
    product_details = Column(JSON, default=dict)
    images = Column(JSON, default=list)

    slug = Column(String(150), unique=True, index=True, nullable=False)
