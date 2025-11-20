from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlmodel import Session, select, func

from app.core.deps import get_session, get_current_user, require_staff
from app.utils.common import generate_unique_slug
from app.models import (
    User,
    Collection,
    CollectionCreate,
    CollectionUpdate,
    CollectionRead,
    Product,
    ProductCollectionLink
)

router = APIRouter()


# Collection Metrics
@router.get("/metrics/")
def get_collection_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)

    total_collections = session.exec(select(func.count(Collection.id))).one()
    active_collections = session.exec(select(func.count(Collection.id)).where(Collection.is_active == True)).one()
    total_linked_products = session.exec(select(func.count(ProductCollectionLink.collection_id))).one()
    avg_products_per_collection = (total_linked_products / total_collections if total_collections > 0 else 0)

    return {
        "total_collections": total_collections,
        "active_collections": active_collections,
        "total_linked_products": total_linked_products,
        "avg_products_per_collection": round(avg_products_per_collection, 2),
    }


# Create Collection
@router.post("/", response_model=CollectionRead, status_code=status.HTTP_201_CREATED)
def create_collection(
        collection: CollectionCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
) -> CollectionRead:
    require_staff(current_user)

    slug = generate_unique_slug(session, Collection, collection.name)

    db_collection = Collection(
        **collection.model_dump(exclude={"product_ids"}),
        slug=slug
    )

    session.add(db_collection)

    if collection.product_ids:
        products = session.exec(
            select(Product).where(Product.id.in_(collection.product_ids))
        ).all()
        db_collection.products = products

    session.commit()
    session.refresh(db_collection)

    product_count = len(db_collection.products) if db_collection.products else 0

    return CollectionRead(
        id=db_collection.id,
        name=db_collection.name,
        slug=db_collection.slug,
        description=db_collection.description,
        is_active=db_collection.is_active,
        created_at=db_collection.created_at,
        updated_at=db_collection.updated_at,
        product_count=product_count,
    )


# Get Single Collection
@router.get("/{collection_id}", response_model=CollectionRead)
def get_collection(
        collection_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> CollectionRead:
    require_staff(current_user)

    collection = session.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    return CollectionRead(
        id=collection.id,
        name=collection.name,
        slug=collection.slug,
        description=collection.description,
        is_active=collection.is_active,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        product_count=len(collection.products or []),
    )


# Get all collections
@router.get("/", response_model=List[CollectionRead])
def get_collections(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        is_active: Optional[bool] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
) -> List[CollectionRead]:
    require_staff(current_user)

    query = select(Collection)

    if is_active is not None:
        query = query.where(Collection.is_active == is_active)

    query = query.order_by(Collection.created_at.desc()).offset(skip).limit(limit)

    collections = session.exec(query).all()

    return [
        CollectionRead(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
            product_count=len(c.products or []),
        )
        for c in collections
    ]


# Update Collection
@router.put("/{collection_id}", response_model=CollectionRead)
def update_collection(
        collection_id: int,
        update_data: CollectionUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> CollectionRead:
    require_staff(current_user)

    db_collection = session.get(Collection, collection_id)
    if not db_collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    data = update_data.model_dump(exclude_unset=True)
    product_ids = data.pop("product_ids", None)

    if "name" in data and data["name"] != db_collection.name:
        new_slug = generate_unique_slug(session, Collection, data["name"])
        db_collection.slug = new_slug

    for key, value in data.items():
        setattr(db_collection, key, value)

    if product_ids is not None:
        products = session.exec(
            select(Product).where(Product.id.in_(product_ids))
        ).all()
        db_collection.products = products

    session.add(db_collection)
    session.commit()
    session.refresh(db_collection)

    product_count = len(db_collection.products or [])

    return CollectionRead(
        id=db_collection.id,
        name=db_collection.name,
        slug=db_collection.slug,
        description=db_collection.description,
        is_active=db_collection.is_active,
        created_at=db_collection.created_at,
        updated_at=db_collection.updated_at,
        product_count=product_count,
    )


# Delete Collection
@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
        collection_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
) -> None:
    require_staff(current_user)

    collection = session.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    session.delete(collection)
    session.commit()
