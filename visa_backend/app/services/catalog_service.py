# app/services/catalog_service.py

from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from starlette import status

from app.models.catalog import (
    Product,
    Collection,
)
from app.schemas.catalog import (
    ProductCreate,
    ProductUpdate,
    CollectionCreate,
    CollectionUpdate,
)
from app.utils.common import generate_unique_slug


# =====================================================================
#                         COLLECTION SERVICES
# =====================================================================


class CollectionService:

    @staticmethod
    def get_metrics(db: Session):
        from app.models.catalog import Collection, product_collection_table
        from sqlalchemy import func, select

        # Total collections
        total_collections = db.query(func.count(Collection.id)).scalar() or 0

        # Active collections
        active_collections = (
            db.query(func.count(Collection.id))
            .filter(Collection.is_active == True)
            .scalar()
            or 0
        )

        # Count the number of links in the association table
        total_linked_products = (
            db.execute(
                select(func.count()).select_from(product_collection_table)
            ).scalar()
            or 0
        )

        avg_products = (
            total_linked_products / total_collections if total_collections > 0 else 0
        )

        return {
            "total_collections": total_collections,
            "active_collections": active_collections,
            "total_linked_products": total_linked_products,
            "avg_products_per_collection": round(avg_products, 2),
        }

    @staticmethod
    def create_collection(db: Session, data: CollectionCreate) -> Collection:
        slug = generate_unique_slug(db, Collection, data.name)
        collection = Collection(
            name=data.name,
            description=data.description,
            slug=slug,
            show_on_landing=data.show_on_landing,
        )
        db.add(collection)
        db.commit()
        db.refresh(collection)

        # Assign products if provided
        if data.product_ids:
            products = db.query(Product).filter(Product.id.in_(data.product_ids)).all()
            collection.products = products
            db.commit()
            db.refresh(collection)

        return collection

    @staticmethod
    def get_collection(db: Session, collection_id: int) -> Collection:
        collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        return collection

    @staticmethod
    def list_collections(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> List[Collection]:

        query = db.query(Collection)

        # Filter by active status
        if is_active is not None:
            query = query.filter(Collection.is_active == is_active)

        # Search on name or slug
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    Collection.name.ilike(like),
                    Collection.slug.ilike(like),
                )
            )

        # Order newest → oldest
        query = query.order_by(Collection.created_at.desc())

        # Pagination
        query = query.offset(skip).limit(limit)

        return query.all()

    @staticmethod
    def update_collection(
        db: Session, collection_id: int, data: CollectionUpdate
    ) -> Collection:

        collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Collection not found")

        # extract update fields
        payload = data.model_dump(exclude_unset=True)

        # handle product linking
        product_ids = payload.pop("product_ids", None)

        # handle slug if name changes
        if "name" in payload and payload["name"] != collection.name:
            new_slug = generate_unique_slug(db, Collection, payload["name"])
            collection.slug = new_slug

        # update simple fields
        for field, value in payload.items():
            setattr(collection, field, value)

        # update products relationship
        if product_ids is not None:
            products = db.query(Product).filter(Product.id.in_(product_ids)).all()
            collection.products = products

        db.commit()
        db.refresh(collection)

        return collection

    @staticmethod
    def delete_collection(db: Session, collection_id: int) -> None:
        collection = db.query(Collection).filter(Collection.id == collection_id).first()

        if not collection:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Collection not found")

        db.delete(collection)
        db.commit()

    # LIST ACTIVE COLLECTIONS
    @staticmethod
    def list_store_collections(db: Session):

        return (
            db.query(Collection)
            .filter(Collection.is_active == True)
            .order_by(Collection.created_at.desc())
            .all()
        )

    # STORE — COLLECTION
    @staticmethod
    def get_store_collection_products(db: Session, slug: str):

        collection = (
            db.query(Collection)
            .filter(Collection.slug == slug, Collection.is_active.is_(True))
            .first()
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

        active_products = [p for p in collection.products if p.is_active]

        return active_products


# =====================================================================
#                         PRODUCT SERVICES
# =====================================================================


class ProductService:

    @staticmethod
    def get_metrics(db: Session) -> dict:
        total_products = db.query(Product).count()
        active_products = db.query(Product).filter(Product.is_active == True).count()
        inactive_products = total_products - active_products

        low_stock_count = 0
        active_products_list = db.query(Product).filter(Product.is_active == True).all()

        for product in active_products_list:
            sizes_data = product.sizes or {}

            # ensure it's a dict; if somehow it's not, skip it safely
            if not isinstance(sizes_data, dict):
                continue

            # Sum all size quantities, treating missing/invalid as 0
            total_stock = 0
            for qty in sizes_data.values():
                try:
                    total_stock += int(qty or 0)
                except (TypeError, ValueError):
                    # if some garbage value sneaks in, treat as 0
                    continue

            if 0 < total_stock < 5:
                low_stock_count += 1

        return {
            "total_products": total_products,
            "active_products": active_products,
            "inactive_products": inactive_products,
            "low_stock_products": low_stock_count,
        }

    # ---------------------------------------------------
    # CREATE PRODUCT
    # ---------------------------------------------------
    @staticmethod
    def create_product(db: Session, data: ProductCreate) -> Product:

        # 🔍 Check for existing SKU
        existing = db.query(Product).filter(Product.sku == data.sku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{data.sku}' already exists.",
            )

        # Generate unique slug
        slug = generate_unique_slug(db, Product, data.name)

        product = Product(
            sku=data.sku,
            name=data.name,
            description=data.description,
            rating=data.rating,
            price=data.price,
            currency=data.currency,
            category=data.category.value,
            sizes=data.sizes,
            care_instructions=data.care_instructions,
            product_details=data.product_details,
            images=data.images,
            slug=slug,
        )

        db.add(product)
        db.commit()
        db.refresh(product)

        return product

    # ---------------------------------------------------
    # GET PRODUCT
    # ---------------------------------------------------
    @staticmethod
    def get_product(db: Session, product_id: int) -> Product:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    # ---------------------------------------------------
    # LIST PRODUCTS (WITH SEARCH + FILTER + PAGINATION)
    # ---------------------------------------------------
    @staticmethod
    def list_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        active_only: bool = False,
    ) -> list[Product]:

        query = db.query(Product)

        # Active products only
        if active_only:
            query = query.filter(Product.is_active == True)

        # Filter by category
        if category:
            query = query.filter(Product.category == category)

        # Search by name / slug / sku
        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(like),
                    Product.slug.ilike(like),
                    Product.sku.ilike(like),
                )
            )

        # Ordering + Pagination
        query = query.order_by(Product.created_at.desc())
        query = query.offset(skip).limit(limit)

        return query.all()

    # ---------------------------------------------------
    # UPDATE PRODUCT
    # ---------------------------------------------------
    @staticmethod
    def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:

        product = ProductService.get_product(db, product_id)

        payload = data.model_dump(exclude_unset=True)

        # Slug regeneration if name changes
        if "name" in payload and payload["name"] != product.name:
            new_slug = generate_unique_slug(db, Product, payload["name"])
            product.slug = new_slug

        # Handle category enum
        if "category" in payload:
            product.category = payload["category"].value
            del payload["category"]

        # Simple fields
        for field, value in payload.items():
            setattr(product, field, value)

        db.commit()
        db.refresh(product)

        return product

    # ---------------------------------------------------
    # DELETE PRODUCT
    # ---------------------------------------------------
    @staticmethod
    def delete_product(db: Session, product_id: int) -> None:
        product = ProductService.get_product(db, product_id)
        db.delete(product)
        db.commit()

    @staticmethod
    def list_store_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ):

        query = db.query(Product).filter(Product.is_active == True)

        if category:
            query = query.filter(Product.category == category)

        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    Product.name.ilike(like),
                    Product.slug.ilike(like),
                    Product.sku.ilike(like),
                )
            )

        query = query.order_by(Product.created_at.desc())
        query = query.offset(skip).limit(limit)

        return query.all()

    @staticmethod
    def get_store_product(db: Session, slug: str):
        product = (
            db.query(Product)
            .filter(Product.slug == slug, Product.is_active.is_(True))
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
