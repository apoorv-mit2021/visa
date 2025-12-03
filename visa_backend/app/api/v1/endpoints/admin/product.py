# app/api/v1/endpoints/admin/product.py

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.models.user import User
from app.schemas.catalog import (
    ProductCreate,
    ProductUpdate,
    ProductRead,
)
from app.services.catalog_service import ProductService
from app.models.catalog import ProductCategory
from app.core.config import settings

router = APIRouter()
ALLOWED_CURRENCIES = settings.ALLOWED_CURRENCIES
DEFAULT_CURRENCY = settings.DEFAULT_CURRENCY


# Product Metrics
@router.get("/metrics/")
def get_product_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return ProductService.get_metrics(db)


# Product categories (for dropdowns)
@router.get("/categories/")
def get_product_categories(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    # Provide value/label pairs to simplify frontend dropdown rendering
    return [
        {"value": c.value, "label": c.value.title()}
        for c in ProductCategory
    ]


# Create Product
@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
        data: ProductCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)
    # Currency handling: default to DEFAULT_CURRENCY if not explicitly provided,
    # normalize to uppercase, and validate against allowed list
    if (not hasattr(data, "model_fields_set")) or ("currency" not in data.model_fields_set) or not data.currency:
        data.currency = DEFAULT_CURRENCY
    currency_upper = data.currency.upper()
    if currency_upper not in ALLOWED_CURRENCIES:
        raise HTTPException(status_code=400,
                            detail=f"Unsupported currency '{data.currency}'. Allowed: {sorted(ALLOWED_CURRENCIES)}")
    data.currency = currency_upper
    product = ProductService.create_product(db, data)
    return ProductRead.model_validate(product)


# Get Single Product
@router.get("/{product_id}", response_model=ProductRead)
def get_product(
        product_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> ProductRead:
    require_staff(current_user)
    product = ProductService.get_product(db, product_id)
    return ProductRead.model_validate(product)


# List Products
@router.get("/", response_model=List[ProductRead])
def list_products(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        category: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> List[ProductRead]:
    require_staff(current_user)
    products = ProductService.list_products(
        db=db,
        skip=skip,
        limit=limit,
        category=category,
        search=search,
    )
    return [ProductRead.model_validate(product) for product in products]


# Update Product
@router.put("/{product_id}", response_model=ProductRead)
def update_product(
        product_id: int,
        data: ProductUpdate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> ProductRead:
    require_staff(current_user)
    # If currency is provided in update, normalize and validate
    if hasattr(data, "model_fields_set") and "currency" in data.model_fields_set and data.currency is not None:
        currency_upper = data.currency.upper()
        if currency_upper not in ALLOWED_CURRENCIES:
            raise HTTPException(status_code=400,
                                detail=f"Unsupported currency '{data.currency}'. Allowed: {sorted(ALLOWED_CURRENCIES)}")
        data.currency = currency_upper
    updated = ProductService.update_product(db, product_id, data)
    return ProductRead.model_validate(updated)


# Delete Product
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
        product_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> None:
    require_staff(current_user)
    ProductService.delete_product(db, product_id)
    return None
