# app/schemas/catalog.py

from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict
from app.models.base import BaseRead
from app.models.catalog import ProductCategory
from app.core.config import settings

DEFAULT_CURRENCY = settings.DEFAULT_CURRENCY


# -----------------------------------------------------
# COLLECTION SCHEMAS
# -----------------------------------------------------
class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    show_on_landing: bool = False
    product_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    show_on_landing: Optional[bool] = None
    product_ids: Optional[List[int]] = None

    model_config = ConfigDict(from_attributes=True)


class CollectionRead(BaseRead):
    id: int
    name: str
    description: Optional[str]
    slug: str
    is_active: bool
    show_on_landing: bool
    product_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------
# PRODUCT SCHEMAS
# -----------------------------------------------------
class ProductCreate(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    rating: float = 0.0
    price: float
    currency: str = DEFAULT_CURRENCY
    category: ProductCategory

    sizes: Dict[str, int] = {}
    care_instructions: List[str] = []
    product_details: Dict[str, str] = {}
    images: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[ProductCategory] = None

    sizes: Optional[Dict[str, int]] = None
    care_instructions: Optional[List[str]] = None
    product_details: Optional[Dict[str, str]] = None
    images: Optional[List[str]] = None

    is_active: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class ProductRead(BaseRead):
    id: int
    sku: str
    name: str
    description: Optional[str]
    rating: float
    price: float
    currency: str

    category: ProductCategory

    sizes: Dict[str, int]
    care_instructions: List[str]
    product_details: Dict[str, str]
    images: List[str]

    slug: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
