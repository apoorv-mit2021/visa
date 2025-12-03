# app/api/v1/admin/product_upload.py

import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
# from PIL import Image

from app.core.deps import get_session
from app.core.config import PRODUCT_IMAGE_DIR
from app.services.catalog_service import ProductService
from app.models.catalog import Product

router = APIRouter(prefix="/admin/products", tags=["Admin Product Upload"])


# -----------------------------------------------------
# Helper function to save file
# -----------------------------------------------------
def save_image(file: UploadFile, compress: bool = True) -> str:
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(400, "Invalid image format")

    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(PRODUCT_IMAGE_DIR, filename)

    # Save raw upload
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    # Optional compression
    # if compress:
    #     try:
    #         img = Image.open(filepath)
    #         img = img.convert("RGB")
    #         img.save(filepath, optimize=True, quality=85)
    #     except Exception:
    #         pass  # If compression fails, keep original

    return filename


# -----------------------------------------------------
# UPLOAD IMAGE FOR PRODUCT
# -----------------------------------------------------
@router.post("/{product_id}/upload-image")
def upload_product_image(
        product_id: int,
        file: UploadFile = File(...),
        db: Session = Depends(get_session),
):
    """
    Upload a new image for a product.
    Automatically stores it in /media/products and updates the product.
    """

    product = ProductService.get_product(db, product_id)

    # Save the image to disk
    saved_filename = save_image(file)

    # Build public URL
    image_url = f"/media/products/{saved_filename}"

    # Add to product images list
    product.images.append(image_url)
    db.commit()
    db.refresh(product)

    return {
        "message": "Image uploaded successfully",
        "filename": saved_filename,
        "url": image_url,
    }


# -----------------------------------------------------
# Image deletion
# -----------------------------------------------------
@router.delete("/{product_id}/delete-image")
def delete_product_image(
        product_id: int,
        url: str,
        db: Session = Depends(get_session),
):
    product = ProductService.get_product(db, product_id)

    if url not in product.images:
        raise HTTPException(400, "Image not associated with product")

    # Remove from db list
    product.images.remove(url)
    db.commit()

    # Remove actual file
    filename = url.split("/")[-1]
    filepath = os.path.join(PRODUCT_IMAGE_DIR, filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    return {"message": "Image deleted"}
