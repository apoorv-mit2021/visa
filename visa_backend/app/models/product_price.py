from typing import Optional
from decimal import Decimal
from sqlmodel import SQLModel, Field, Relationship, CheckConstraint
from .base import BaseTable, BaseRead
from app.core.config import ALLOWED_CURRENCIES


# -----------------------------------------------------
# BASE MODEL
# -----------------------------------------------------
class ProductPriceBase(SQLModel):
    """Shared fields for product price records."""
    currency: str = Field(
        max_length=3,
        description="ISO currency code (e.g., USD, EUR, INR)"
    )
    price: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=2,
        description="Variant price in specified currency"
    )
    is_active: bool = Field(default=True, description="Mark to disable a price temporarily")


# -----------------------------------------------------
# DATABASE MODEL
# -----------------------------------------------------
class ProductPrice(ProductPriceBase, BaseTable, table=True):
    """Stores price per currency for a specific product variant."""
    __tablename__ = "product_prices"

    variant_id: int = Field(foreign_key="product_variants.id", index=True)

    variant: "ProductVariant" = Relationship(back_populates="prices")

    # Optional DB-level constraint for basic validation
    __table_args__ = (
        CheckConstraint("price > 0", name="check_price_positive"),
    )


# -----------------------------------------------------
# SCHEMAS
# -----------------------------------------------------
class ProductPriceCreate(ProductPriceBase):
    """Schema for creating a price record."""
    pass


class ProductPriceUpdate(SQLModel):
    """Schema for updating a price record."""
    currency: Optional[str] = None
    price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ProductPriceRead(ProductPriceBase, BaseRead):
    """Read schema for returning a price record."""
    id: int
    variant_id: int


# ✅ Import at end to avoid circular imports
from app.models.product_variant import ProductVariant
