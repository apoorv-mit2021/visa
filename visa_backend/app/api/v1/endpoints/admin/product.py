# backend/app/api/v1/endpoints/admin/product.py

from typing import List, Optional
import os
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlmodel import Session, select, func

from app.core.deps import get_session, get_current_user, require_staff
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    AdminProductListSchema,
    AdminProductDetailSchema,
    AdminProductMetricsSchema,
    map_admin_product_list,
    map_admin_product_detail,
    AdminProductImageSchema,
    map_admin_product_image
)
from app.models import (
    User,
    Product,
    ProductVariant,
    ProductPrice,
    ProductImage,
    ProductAttribute
)
from app.utils.common import generate_unique_slug
from app.utils.currency import ALLOWED_CURRENCIES

router = APIRouter()

# Media base directory (must be mounted at /media in app.main)
MEDIA_ROOT = os.getenv("MEDIA_ROOT", "media")


# Product Metrics
@router.get("/metrics/", response_model=AdminProductMetricsSchema)
def get_product_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    total_products = session.exec(select(func.count(Product.id))).one()
    active_products = session.exec(
        select(func.count(Product.id)).where(Product.is_active == True)
    ).one()
    total_variants = session.exec(select(func.count(ProductVariant.id))).one()
    low_stock = session.exec(
        select(func.count(ProductVariant.id)).where(ProductVariant.stock_quantity < 10)
    ).one()

    return AdminProductMetricsSchema(
        total_products=total_products,
        active_products=active_products,
        total_variants=total_variants,
        low_stock=low_stock,
    )


# Create Product
@router.post("/", response_model=AdminProductDetailSchema, status_code=status.HTTP_201_CREATED)
def create_product(
        payload: ProductCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)

    slug = generate_unique_slug(session, Product, payload.name)

    # Create product
    product = Product(
        name=payload.name,
        description=payload.description,
        category=payload.category,
        slug=slug,
        is_active=True,
    )
    session.add(product)
    session.flush()

    # Create variants
    for v in payload.variants:
        variant_slug = generate_unique_slug(session, ProductVariant, v.name or v.sku)
        variant = ProductVariant(
            product_id=product.id,
            sku=v.sku,
            slug=variant_slug,
            name=v.name,
            stock_quantity=v.stock_quantity or 0,
            is_default=v.is_default,
            is_active=v.is_active,
            weight=v.weight,
            length=v.length,
            width=v.width,
            height=v.height,
        )
        session.add(variant)
        session.flush()

        # Prices
        for p in v.prices or []:
            if p.currency not in ALLOWED_CURRENCIES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Currency {p.currency} not supported."
                )
            session.add(ProductPrice(
                variant_id=variant.id,
                currency=p.currency,
                price=p.price,
                is_active=p.is_active,
            ))

        # Attributes
        for a in v.attributes or []:
            session.add(ProductAttribute(
                variant_id=variant.id,
                name=a.name,
                value=a.value,
                is_active=a.is_active,
            ))

    session.commit()
    session.refresh(product)
    return map_admin_product_detail(product)


# Get All Products
@router.get("/", response_model=List[AdminProductListSchema])
def list_products(
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=200),
        is_active: Optional[bool] = Query(None),
        search: Optional[str] = Query(None),
        category: Optional[str] = Query(None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)

    query = select(Product)

    if is_active is not None:
        query = query.where(Product.is_active == is_active)

    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    if category:
        query = query.where(Product.category == category)

    query = query.order_by(Product.created_at.desc()).offset(skip).limit(limit)

    items = session.exec(query).all()
    return [map_admin_product_list(p) for p in items]


# Get Product by ID
@router.get("/{product_id}", response_model=AdminProductDetailSchema)
def get_product(
        product_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)

    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return map_admin_product_detail(product)


# Update Product
@router.put("/{product_id}", response_model=AdminProductDetailSchema)
def update_product(
        product_id: int,
        payload: ProductUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # ------------------------------------------------------------
    # UPDATE PRODUCT SLUG ONLY IF NAME CHANGED
    # ------------------------------------------------------------
    if payload.name and payload.name != product.name:
        new_slug = generate_unique_slug(session, Product, payload.name)
        product.slug = new_slug

    # ------------------------------------------------------------
    # UPDATE PRODUCT FIELDS
    # ------------------------------------------------------------
    for k, v in payload.model_dump(exclude_unset=True).items():
        if k not in ["variants", "slug"]:  # slug is handled above
            setattr(product, k, v)

    # ------------------------------------------------------------
    # VARIANTS (sync create/update)
    # ------------------------------------------------------------
    if payload.variants:
        for v in payload.variants:

            # ------------------------------------------------------------
            # 1️⃣ CREATE NEW VARIANT
            # ------------------------------------------------------------
            if v.id is None:
                variant_slug = generate_unique_slug(session, ProductVariant, v.name or v.sku)
                new_variant = ProductVariant(
                    product_id=product.id,
                    sku=v.sku,
                    slug=variant_slug,
                    name=v.name,
                    stock_quantity=v.stock_quantity or 0,
                    is_default=v.is_default,
                    is_active=v.is_active,
                    weight=v.weight,
                    length=v.length,
                    width=v.width,
                    height=v.height,
                )
                session.add(new_variant)
                session.flush()

                # Prices
                for p in v.prices or []:
                    session.add(
                        ProductPrice(
                            variant_id=new_variant.id,
                            currency=p.currency,
                            price=p.price,
                            is_active=p.is_active,
                        )
                    )

                # Attributes
                for a in v.attributes or []:
                    session.add(
                        ProductAttribute(
                            variant_id=new_variant.id,
                            name=a.name,
                            value=a.value,
                            is_active=a.is_active,
                        )
                    )

                continue

            # ------------------------------------------------------------
            # 2️⃣ UPDATE EXISTING VARIANT
            # ------------------------------------------------------------
            variant = session.get(ProductVariant, v.id)
            if not variant:
                raise HTTPException(status_code=404, detail="Variant not found")

            # Regenerate slug if name changed
            if v.name and v.name != variant.name:
                variant.slug = generate_unique_slug(session, ProductVariant, v.name)

            # Update basic fields
            for field, value in v.model_dump(exclude_unset=True).items():
                if field not in ["prices", "attributes", "slug"]:
                    setattr(variant, field, value)

            # ------------------------------------------------------------
            # PRICES — FULL SYNC
            # ------------------------------------------------------------
            existing_prices = {p.id: p for p in variant.prices}
            incoming_prices = {p.id: p for p in (v.prices or []) if p.id}

            # Deleted items
            for pid, record in existing_prices.items():
                if pid not in incoming_prices:
                    session.delete(record)

            # Update / create
            for p in v.prices or []:
                if p.id is None:
                    session.add(
                        ProductPrice(
                            variant_id=variant.id,
                            currency=p.currency,
                            price=p.price,
                            is_active=p.is_active,
                        )
                    )
                else:
                    price_record = existing_prices.get(p.id)
                    if price_record:
                        price_record.currency = p.currency
                        price_record.price = p.price
                        price_record.is_active = p.is_active

            # ------------------------------------------------------------
            # ATTRIBUTES — FULL SYNC
            # ------------------------------------------------------------
            existing_attrs = {a.id: a for a in variant.attributes}
            incoming_attrs = {a.id: a for a in (v.attributes or []) if a.id}

            # Deleted attributes
            for aid, record in existing_attrs.items():
                if aid not in incoming_attrs:
                    session.delete(record)

            # Update / create
            for a in v.attributes or []:
                if a.id is None:
                    # New
                    session.add(
                        ProductAttribute(
                            variant_id=variant.id,
                            name=a.name,
                            value=a.value,
                            is_active=a.is_active,
                        )
                    )
                else:
                    # Update
                    attr_record = existing_attrs.get(a.id)
                    if attr_record:
                        attr_record.name = a.name
                        attr_record.value = a.value
                        attr_record.is_active = a.is_active

    # Finalize
    session.commit()
    session.refresh(product)
    return map_admin_product_detail(product)


# Delete Product
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
        product_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user)
):
    require_staff(current_user)

    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    session.delete(product)
    session.commit()


# --------------------------------------------
# Upload Product Image (server-side storage)
# --------------------------------------------
@router.post(
    "/variants/{variant_id}/images",
    response_model=AdminProductImageSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and attach an image to a variant (stored on server)",
)
async def upload_variant_image(
        variant_id: int,
        file: UploadFile = File(..., description="Image file to upload"),
        alt_text: Optional[str] = Form(default=None),
        display_order: int = Form(default=0),
        is_primary: bool = Form(default=False),
        is_active: bool = Form(default=True),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Uploads an image file to the server under media/products and
    creates a ProductImage linked to the given variant.
    Returns the created image schema with a URL path that can be served by /media.
    """
    require_staff(current_user)

    # Validate variant exists
    variant = session.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    # Validate file type and determine extension
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_exts:
        # Try to infer from content type
        ct = (file.content_type or "").lower()
        if ct == "image/jpeg":
            ext = ".jpg"
        elif ct == "image/png":
            ext = ".png"
        elif ct == "image/webp":
            ext = ".webp"
        else:
            raise HTTPException(status_code=400, detail="Unsupported image type. Allowed: jpg, jpeg, png, webp")

    # Build storage paths
    dest_dir = os.path.join(MEDIA_ROOT, "products", f"variant_{variant_id}")
    os.makedirs(dest_dir, exist_ok=True)
    filename = f"{uuid4().hex}{ext}"
    disk_path = os.path.join(dest_dir, filename)
    url_path = f"/media/products/variant_{variant_id}/{filename}"

    # Save file to disk
    try:
        # Prefer streaming to avoid loading into memory
        with open(disk_path, "wb") as out_file:
            # UploadFile.file is a SpooledTemporaryFile
            out_file.write(await file.read())
    except Exception as e:
        # Cleanup partial file if created
        try:
            if os.path.exists(disk_path):
                os.remove(disk_path)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")

    # If marking as primary, unset others
    if is_primary:
        others = session.exec(
            select(ProductImage).where(
                ProductImage.variant_id == variant_id,
                ProductImage.is_primary == True,
            )
        ).all()
        for o in others:
            o.is_primary = False

    # Create DB record
    image = ProductImage(
        variant_id=variant_id,
        image_url=url_path,
        alt_text=alt_text,
        display_order=display_order,
        is_primary=is_primary,
        is_active=is_active,
    )
    session.add(image)
    session.commit()
    session.refresh(image)

    return AdminProductImageSchema(
        id=image.id,
        image_url=image.image_url,
        alt_text=image.alt_text,
        display_order=image.display_order,
        is_primary=image.is_primary,
        is_active=image.is_active,
    )


# Update Image Metadata (PUT /images/{image_id})
@router.put(
    "/images/{image_id}",
    response_model=AdminProductImageSchema,
    summary="Update product image metadata (alt, order, primary, active)",
)
def update_image_metadata(
        image_id: int,
        alt_text: Optional[str] = Form(default=None),
        display_order: Optional[int] = Form(default=None),
        is_primary: Optional[bool] = Form(default=None),
        is_active: Optional[bool] = Form(default=None),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    image = session.get(ProductImage, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # If marking as primary, unset others
    if is_primary:
        others = session.exec(
            select(ProductImage)
            .where(
                ProductImage.variant_id == image.variant_id,
                ProductImage.id != image_id,
                ProductImage.is_primary == True,
            )
        ).all()
        for other in others:
            other.is_primary = False

    if alt_text is not None:
        image.alt_text = alt_text
    if display_order is not None:
        image.display_order = display_order
    if is_primary is not None:
        image.is_primary = is_primary
    if is_active is not None:
        image.is_active = is_active

    session.add(image)
    session.commit()
    session.refresh(image)

    return map_admin_product_image(image)


# Replace Image File (PUT /images/{image_id}/file)
@router.put(
    "/images/{image_id}/file",
    response_model=AdminProductImageSchema,
    summary="Replace the physical image file (keeps metadata)",
)
async def replace_image_file(
        image_id: int,
        file: UploadFile = File(...),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    image = session.get(ProductImage, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Determine storage folder
    variant_id = image.variant_id
    dest_dir = os.path.join(MEDIA_ROOT, "products", f"variant_{variant_id}")
    os.makedirs(dest_dir, exist_ok=True)

    # Determine new extension
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename or "")[1].lower()

    if ext not in allowed_exts:
        ct = file.content_type
        if ct in ["image/jpeg", "image/jpg"]:
            ext = ".jpg"
        elif ct == "image/png":
            ext = ".png"
        elif ct == "image/webp":
            ext = ".webp"
        else:
            raise HTTPException(status_code=400, detail="Invalid image type")

    # Delete old file
    old_path = image.image_url.replace("/media/", f"{MEDIA_ROOT}/")
    if os.path.exists(old_path):
        try:
            os.remove(old_path)
        except Exception:
            pass

    # Save new file
    new_filename = f"{uuid4().hex}{ext}"
    new_disk_path = os.path.join(dest_dir, new_filename)
    new_url_path = f"/media/products/variant_{variant_id}/{new_filename}"

    with open(new_disk_path, "wb") as out_file:
        out_file.write(await file.read())

    # Update DB record
    image.image_url = new_url_path

    session.add(image)
    session.commit()
    session.refresh(image)

    return map_admin_product_image(image)


# Delete Image (DELETE /images/{image_id})
@router.delete(
    "/images/{image_id}",
    status_code=200,
    summary="Delete image from database and filesystem",
)
def delete_image(
        image_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    image = session.get(ProductImage, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Check if the file exists and delete
    disk_path = image.image_url.replace("/media/", f"{MEDIA_ROOT}/")
    if os.path.exists(disk_path):
        try:
            os.remove(disk_path)
        except Exception:
            pass

    # Optional: remove the now-empty variant folder
    try:
        variant_folder = os.path.dirname(disk_path)
        if os.path.exists(variant_folder) and not os.listdir(variant_folder):
            os.rmdir(variant_folder)
    except Exception:
        # Best-effort cleanup; ignore failures
        pass

    variant_id = image.variant_id

    session.delete(image)
    session.commit()

    # Ensure a primary image still exists
    remaining = session.exec(
        select(ProductImage).where(ProductImage.variant_id == variant_id)
    ).all()

    if remaining:
        primary_exists = any(img.is_primary for img in remaining)
        if not primary_exists:
            # Assign first as primary
            remaining[0].is_primary = True
            session.add(remaining[0])
            session.commit()

    return {"message": "Image deleted successfully"}
