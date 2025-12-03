# app/api/v1/endpoints/admin/collection.py

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.models.user import User
from app.schemas.catalog import (
    CollectionCreate,
    CollectionUpdate,
    CollectionRead,
)
from app.services.catalog_service import CollectionService

router = APIRouter()


# Collection Metrics
@router.get("/metrics/")
def get_collection_metrics(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return CollectionService.get_metrics(db)


# Create Collection
@router.post(
    "/",
    response_model=CollectionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_collection(
    data: CollectionCreate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> CollectionRead:
    require_staff(current_user)
    collection = CollectionService.create_collection(db, data)
    return CollectionRead.model_validate(collection)


# Get Single Collection
@router.get("/{collection_id}", response_model=CollectionRead)
def get_collection(
    collection_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> CollectionRead:
    require_staff(current_user)
    collection = CollectionService.get_collection(db, collection_id)
    return CollectionRead.model_validate(collection)


# Get all collections
@router.get("/", response_model=List[CollectionRead])
def list_collections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> List[CollectionRead]:
    require_staff(current_user)
    collections = CollectionService.list_collections(
        db=db,
        skip=skip,
        limit=limit,
        is_active=is_active,
        search=search,
    )
    return [CollectionRead.model_validate(c) for c in collections]


# Update Collection
@router.put("/{collection_id}", response_model=CollectionRead)
def update_collection(
    collection_id: int,
    data: CollectionUpdate,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> CollectionRead:
    require_staff(current_user)
    updated = CollectionService.update_collection(db, collection_id, data)
    return CollectionRead.model_validate(updated)


# Delete Collection
@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    require_staff(current_user)
    CollectionService.delete_collection(db, collection_id)
    return None
