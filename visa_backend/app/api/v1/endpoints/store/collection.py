# backend/app/api/v1/endpoints/store/collection.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_session
from app.schemas.catalog import CollectionRead, ProductRead
from app.services.catalog_service import CollectionService

router = APIRouter()


# ---------------------------------------------------------
# PUBLIC — LIST ACTIVE COLLECTIONS
# ---------------------------------------------------------
@router.get("/", summary="List active collections")
def list_store_collections(
        db: Session = Depends(get_session)
) -> List[CollectionRead]:
    collections = CollectionService.list_store_collections(db=db)
    return collections


# ---------------------------------------------------------
# PUBLIC — GET COLLECTION PRODUCTS
# ---------------------------------------------------------
@router.get("/{slug}/products/", summary="Get active products in a collection")
def get_collection_products(
        slug: str,
        db: Session = Depends(get_session)
) -> List[ProductRead]:
    products = CollectionService.get_store_collection_products(db=db, slug=slug)
    return products
