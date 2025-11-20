# # backend/app/api/v1/endpoints/admin/variant.py
#
# from fastapi import APIRouter, HTTPException, Depends, Query, status
# from sqlmodel import Session, select
# from typing import List, Optional
#
# from app.models import (
#     User,
#     Product,
#     ProductVariant,
#     ProductVariantCreate,
#     ProductVariantUpdate,
#     ProductVariantRead,
#     ProductPrice,
#     ProductImage,
#     ProductAttribute,
# )
# from app.core.deps import get_session, get_current_user, require_staff
#
# router = APIRouter()
#
# # Allowed values
# ALLOWED_CURRENCIES = {"USD", "CAD", "EUR"}
# ALLOWED_ATTRIBUTES = {
#     "Carat", "Center Stone", "Certification", "Clarity", "Clasp", "Color", "Cut",
#     "Diamonds", "Halo Diamonds", "Length", "Material", "Pearl Size",
#     "Pearl Type", "Setting", "Size", "Stone"
# }
#
#
# # CREATE VARIANT
# @router.post("/", response_model=ProductVariantRead, status_code=status.HTTP_201_CREATED)
# def create_variant(
#         product_id: int,
#         variant: ProductVariantCreate,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> ProductVariantRead:
#     require_staff(current_user)
#
#     product = session.get(Product, product_id)
#     if not product:
#         raise HTTPException(status_code=404, detail="Parent product not found")
#
#     if session.exec(select(ProductVariant).where(ProductVariant.sku == variant.sku)).first():
#         raise HTTPException(status_code=400, detail="Variant with this SKU already exists")
#
#     db_variant = ProductVariant(
#         product_id=product_id,
#         sku=variant.sku,
#         name=variant.name,
#         stock_quantity=variant.stock_quantity,
#         is_default=variant.is_default,
#     )
#
#     session.add(db_variant)
#     session.commit()
#     session.refresh(db_variant)
#
#     return ProductVariantRead(
#         id=db_variant.id,
#         sku=db_variant.sku,
#         name=db_variant.name,
#         stock_quantity=db_variant.stock_quantity,
#         is_default=db_variant.is_default,
#         prices=[],
#         images=[],
#         attributes=[],
#         created_at=db_variant.created_at,
#         updated_at=db_variant.updated_at,
#     )
#
#
# # GET VARIANTS (LIST)
# @router.get("/", response_model=List[ProductVariantRead])
# def get_variants(
#         product_id: Optional[int] = Query(None, description="Filter by product ID"),
#         is_default: Optional[bool] = None,
#         skip: int = Query(0, ge=0),
#         limit: int = Query(100, ge=1, le=1000),
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> List[ProductVariantRead]:
#     require_staff(current_user)
#
#     query = select(ProductVariant)
#     if product_id:
#         query = query.where(ProductVariant.product_id == product_id)
#     if is_default is not None:
#         query = query.where(ProductVariant.is_default == is_default)
#
#     variants = session.exec(query.offset(skip).limit(limit)).all()
#
#     return [
#         ProductVariantRead(
#             id=v.id,
#             sku=v.sku,
#             name=v.name,
#             stock_quantity=v.stock_quantity,
#             is_default=v.is_default,
#             created_at=v.created_at,
#             updated_at=v.updated_at,
#             prices=[
#                 {
#                     "id": p.id,
#                     "currency": p.currency,
#                     "price": p.price,
#                     "created_at": p.created_at,
#                     "updated_at": p.updated_at,
#                 }
#                 for p in (v.prices or [])
#             ],
#             images=[
#                 {
#                     "id": i.id,
#                     "image_url": i.image_url,
#                     "alt_text": i.alt_text,
#                     "display_order": i.display_order,
#                     "is_primary": i.is_primary,
#                     "created_at": i.created_at,
#                     "updated_at": i.updated_at,
#                 }
#                 for i in (v.images or [])
#             ],
#             attributes=[
#                 {
#                     "id": a.id,
#                     "name": a.name,
#                     "value": a.value,
#                     "created_at": a.created_at,
#                     "updated_at": a.updated_at,
#                 }
#                 for a in (v.attributes or [])
#             ],
#         )
#         for v in variants
#     ]
#
#
# # GET SINGLE VARIANT
# @router.get("/{variant_id}", response_model=ProductVariantRead)
# def get_variant(
#         variant_id: int,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> ProductVariantRead:
#     require_staff(current_user)
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     return ProductVariantRead(
#         id=variant.id,
#         sku=variant.sku,
#         name=variant.name,
#         stock_quantity=variant.stock_quantity,
#         is_default=variant.is_default,
#         created_at=variant.created_at,
#         updated_at=variant.updated_at,
#         prices=[
#             {
#                 "id": p.id,
#                 "currency": p.currency,
#                 "price": p.price,
#                 "created_at": p.created_at,
#                 "updated_at": p.updated_at,
#             }
#             for p in (variant.prices or [])
#         ],
#         images=[
#             {
#                 "id": i.id,
#                 "image_url": i.image_url,
#                 "alt_text": i.alt_text,
#                 "display_order": i.display_order,
#                 "is_primary": i.is_primary,
#                 "created_at": i.created_at,
#                 "updated_at": i.updated_at,
#             }
#             for i in (variant.images or [])
#         ],
#         attributes=[
#             {
#                 "id": a.id,
#                 "name": a.name,
#                 "value": a.value,
#                 "created_at": a.created_at,
#                 "updated_at": a.updated_at,
#             }
#             for a in (variant.attributes or [])
#         ],
#     )
#
#
# # UPDATE VARIANT
# @router.put("/{variant_id}", response_model=ProductVariantRead)
# def update_variant(
#         variant_id: int,
#         variant_update: ProductVariantUpdate,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> ProductVariantRead:
#     require_staff(current_user)
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     # Ensure SKU uniqueness
#     if variant_update.sku and variant_update.sku != variant.sku:
#         existing = session.exec(
#             select(ProductVariant).where(ProductVariant.sku == variant_update.sku)
#         ).first()
#         if existing:
#             raise HTTPException(status_code=400, detail="Variant with this SKU already exists")
#
#     for key, value in variant_update.model_dump(exclude_unset=True).items():
#         setattr(variant, key, value)
#
#     session.add(variant)
#     session.commit()
#     session.refresh(variant)
#
#     return ProductVariantRead(
#         id=variant.id,
#         sku=variant.sku,
#         name=variant.name,
#         stock_quantity=variant.stock_quantity,
#         is_default=variant.is_default,
#         created_at=variant.created_at,
#         updated_at=variant.updated_at,
#         prices=[
#             {
#                 "id": p.id,
#                 "currency": p.currency,
#                 "price": p.price,
#                 "created_at": p.created_at,
#                 "updated_at": p.updated_at,
#             }
#             for p in (variant.prices or [])
#         ],
#         images=[
#             {
#                 "id": i.id,
#                 "image_url": i.image_url,
#                 "alt_text": i.alt_text,
#                 "display_order": i.display_order,
#                 "is_primary": i.is_primary,
#                 "created_at": i.created_at,
#                 "updated_at": i.updated_at,
#             }
#             for i in (variant.images or [])
#         ],
#         attributes=[
#             {
#                 "id": a.id,
#                 "name": a.name,
#                 "value": a.value,
#                 "created_at": a.created_at,
#                 "updated_at": a.updated_at,
#             }
#             for a in (variant.attributes or [])
#         ],
#     )
#
#
# # DELETE VARIANT
# @router.delete("/{variant_id}", status_code=status.HTTP_200_OK)
# def delete_variant(
#         variant_id: int,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     session.delete(variant)
#     session.commit()
#     return {"message": f"Variant '{variant.sku}' deleted successfully"}
#
#
# # UPDATE STOCK
# @router.patch("/{variant_id}/stock", response_model=dict)
# def update_variant_stock(
#         variant_id: int,
#         stock_quantity: int,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     variant.stock_quantity = stock_quantity
#     session.add(variant)
#     session.commit()
#     session.refresh(variant)
#
#     return {
#         "message": "Stock updated successfully",
#         "variant_id": variant_id,
#         "new_stock": stock_quantity,
#     }
#
#
# # ADD OR UPDATE PRICE
# @router.post("/{variant_id}/prices", response_model=dict)
# def add_or_update_price(
#         variant_id: int,
#         currency: str,
#         price: float,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     currency = currency.upper()
#     if currency not in ALLOWED_CURRENCIES:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid currency '{currency}'. Allowed: {', '.join(ALLOWED_CURRENCIES)}",
#         )
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     existing = session.exec(
#         select(ProductPrice)
#         .where(ProductPrice.variant_id == variant_id)
#         .where(ProductPrice.currency == currency)
#     ).first()
#
#     if existing:
#         existing.price = price
#         msg = "Price updated successfully"
#     else:
#         new_price = ProductPrice(variant_id=variant_id, currency=currency, price=price)
#         session.add(new_price)
#         msg = "Price added successfully"
#
#     session.commit()
#     return {"message": msg, "currency": currency, "price": price}
#
#
# # ADD ATTRIBUTE
# @router.post("/{variant_id}/attributes", response_model=dict)
# def add_attribute(
#         variant_id: int,
#         name: str,
#         value: str,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     if name not in ALLOWED_ATTRIBUTES:
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid attribute '{name}'. Allowed: {', '.join(sorted(ALLOWED_ATTRIBUTES))}",
#         )
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     attribute = ProductAttribute(variant_id=variant_id, name=name, value=value)
#     session.add(attribute)
#     session.commit()
#
#     return {"message": "Attribute added successfully", "attribute": {"name": name, "value": value}}
#
#
# # ADD IMAGE
# @router.post("/{variant_id}/images", response_model=dict)
# def add_image(
#         variant_id: int,
#         image_url: str,
#         alt_text: Optional[str] = None,
#         is_primary: bool = False,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     variant = session.get(ProductVariant, variant_id)
#     if not variant:
#         raise HTTPException(status_code=404, detail="Variant not found")
#
#     image = ProductImage(
#         variant_id=variant_id,
#         image_url=image_url,
#         alt_text=alt_text,
#         is_primary=is_primary,
#     )
#     session.add(image)
#     session.commit()
#
#     return {"message": "Image added successfully", "image_url": image_url}
#
#
# # PATCH ENDPOINTS (UPDATE SPECIFIC FIELDS)
# @router.patch("/{variant_id}/prices/{price_id}", response_model=dict)
# def update_price(
#         variant_id: int,
#         price_id: int,
#         price: float,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     """Update existing price"""
#     require_staff(current_user)
#
#     price_obj = session.get(ProductPrice, price_id)
#     if not price_obj or price_obj.variant_id != variant_id:
#         raise HTTPException(status_code=404, detail="Price not found")
#
#     price_obj.price = price
#     session.add(price_obj)
#     session.commit()
#     session.refresh(price_obj)
#
#     return {"message": "Price updated successfully", "price_id": price_id, "new_price": price}
#
#
# @router.patch("/{variant_id}/attributes/{attribute_id}", response_model=dict)
# def update_attribute(
#         variant_id: int,
#         attribute_id: int,
#         value: str,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     """Update existing attribute"""
#     require_staff(current_user)
#
#     attribute = session.get(ProductAttribute, attribute_id)
#     if not attribute or attribute.variant_id != variant_id:
#         raise HTTPException(status_code=404, detail="Attribute not found")
#
#     attribute.value = value
#     session.add(attribute)
#     session.commit()
#     session.refresh(attribute)
#
#     return {"message": "Attribute updated successfully", "attribute_id": attribute_id, "new_value": value}
#
#
# @router.patch("/{variant_id}/images/{image_id}", response_model=dict)
# def update_image(
#         variant_id: int,
#         image_id: int,
#         image_url: Optional[str] = None,
#         alt_text: Optional[str] = None,
#         is_primary: Optional[bool] = None,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     """Update existing image"""
#     require_staff(current_user)
#
#     image = session.get(ProductImage, image_id)
#     if not image or image.variant_id != variant_id:
#         raise HTTPException(status_code=404, detail="Image not found")
#
#     if image_url is not None:
#         image.image_url = image_url
#     if alt_text is not None:
#         image.alt_text = alt_text
#     if is_primary is not None:
#         image.is_primary = is_primary
#
#     session.add(image)
#     session.commit()
#     session.refresh(image)
#
#     return {
#         "message": "Image updated successfully",
#         "image_id": image_id,
#         "image_url": image.image_url,
#         "alt_text": image.alt_text,
#         "is_primary": image.is_primary,
#     }
#
#
# # DELETE PRICE
# @router.delete("/{variant_id}/prices/{price_id}", status_code=status.HTTP_200_OK)
# def delete_price(
#         variant_id: int,
#         price_id: int,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     price = session.get(ProductPrice, price_id)
#     if not price or price.variant_id != variant_id:
#         raise HTTPException(status_code=404, detail="Price not found")
#
#     session.delete(price)
#     session.commit()
#
#     return {"message": f"Price (ID: {price_id}) deleted successfully from variant {variant_id}"}
#
#
# # DELETE ATTRIBUTE
# @router.delete("/{variant_id}/attributes/{attribute_id}", status_code=status.HTTP_200_OK)
# def delete_attribute(
#         variant_id: int,
#         attribute_id: int,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     attribute = session.get(ProductAttribute, attribute_id)
#     if not attribute or attribute.variant_id != variant_id:
#         raise HTTPException(status_code=404, detail="Attribute not found")
#
#     session.delete(attribute)
#     session.commit()
#
#     return {"message": f"Attribute (ID: {attribute_id}) deleted successfully from variant {variant_id}"}
#
#
# # DELETE IMAGE
# @router.delete("/{variant_id}/images/{image_id}", status_code=status.HTTP_200_OK)
# def delete_image(
#         variant_id: int,
#         image_id: int,
#         session: Session = Depends(get_session),
#         current_user: User = Depends(get_current_user),
# ) -> dict:
#     require_staff(current_user)
#
#     image = session.get(ProductImage, image_id)
#     if not image or image.variant_id != variant_id:
#         raise HTTPException(status_code=404, detail="Image not found")
#
#     session.delete(image)
#     session.commit()
#
#     return {"message": f"Image (ID: {image_id}) deleted successfully from variant {variant_id}"}
