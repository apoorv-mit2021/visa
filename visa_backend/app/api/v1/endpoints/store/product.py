# backend/app/api/v1/endpoints/store/product.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_session
from app.schemas.catalog import ProductRead
from app.services.catalog_service import ProductService

router = APIRouter()


# ---------------------------------------------------------
# PUBLIC — LIST PRODUCTS
# ---------------------------------------------------------
@router.get("/", response_model=List[ProductRead])
def list_products(
        db: Session = Depends(get_session),
        search: Optional[str] = Query(None),
        category: Optional[str] = Query(None),
        limit: int = Query(20, ge=1, le=100),
        offset: int = Query(0, ge=0),
):
    products = ProductService.list_store_products(
        db=db,
        search=search,
        category=category,
        skip=offset,
        limit=limit
    )
    return products


# ---------------------------------------------------------
# PUBLIC — PRODUCT DETAIL
# ---------------------------------------------------------
@router.get("/{slug}", response_model=ProductRead)
def get_product_detail(
        slug: str,
        db: Session = Depends(get_session),
):
    product = ProductService.get_store_product(db, slug)
    return product
