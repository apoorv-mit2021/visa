#!/usr/bin/env python3
"""
Seed the database with sample Products, Variants, Prices, Images, and Attributes.
Safe to run multiple times.
"""

import os
import sys
from decimal import Decimal
from sqlmodel import Session, select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine
from app.models import (
    Product,
    ProductVariant,
    ProductPrice,
    ProductImage,
    ProductAttribute,
    Collection,
)


# ----------------------------
# SAMPLE PRODUCTS
# ----------------------------
sample_products = [
    {
        "name": "Eternal Solitaire Diamond Ring",
        "slug": "eternal-solitaire-diamond-ring",
        "description": "A timeless masterpiece featuring a brilliant 1.5-carat round diamond.",
        "category": "Rings",
        "variant": {
            "sku": "ESD-001-PLT",
            "slug": "esd-001-plt",
            "price": 8999,
            "images": [
                "https://cdn.example.com/images/ring1.png",
                "https://cdn.example.com/images/ring2.png",
            ],
            "attributes": {
                "Material": ["Platinum 950"],
                "Stone": ["Diamond"],
                "Color": ["White"],
                "Size": ["6"],
                "Carat": ["1.5ct"],
                "Clarity": ["VVS1"],
                "Cut": ["Excellent"],
            },
        },
    },
    {
        "name": "Pearl Elegance Necklace",
        "slug": "pearl-elegance-necklace",
        "description": "A sophisticated pearl necklace featuring South Sea pearls.",
        "category": "Necklaces",
        "variant": {
            "sku": "PEN-002-GLD",
            "slug": "pen-002-gld",
            "price": 4299,
            "images": [
                "https://cdn.example.com/images/necklace1.png",
            ],
            "attributes": {
                "Material": ["18K Gold"],
                "Stone": ["Pearl"],
                "Color": ["White"],
                "Size": ["18 inch"],
                "Pearl Type": ["South Sea"],
            },
        },
    },
    {
        "name": "Rose Gold Tennis Bracelet",
        "slug": "rose-gold-tennis-bracelet",
        "description": "Stunning tennis bracelet featuring brilliant diamonds.",
        "category": "Bracelets",
        "variant": {
            "sku": "RGB-003-RGD",
            "slug": "rgb-003-rgd",
            "price": 5799,
            "images": [
                "https://cdn.example.com/images/bracelet1.png",
            ],
            "attributes": {
                "Material": ["18K Rose Gold"],
                "Stone": ["Diamond"],
                "Color": ["Rose Gold"],
                "Size": ["7 inch"],
            },
        },
    },
]


def seed_products():
    with Session(engine) as session:

        existing_slugs = {p.slug for p in session.exec(select(Product)).all()}

        for pdata in sample_products:

            # SKIP EXISTING PRODUCT
            if pdata["slug"] in existing_slugs:
                print(f"ℹ️ Skipping (already exists): {pdata['name']}")
                continue

            variant_data = pdata.pop("variant")

            # 1️⃣ CREATE PRODUCT
            product = Product(
                name=pdata["name"],
                slug=pdata["slug"],
                description=pdata["description"],
                category=pdata["category"],
                is_active=True,
            )

            session.add(product)
            session.flush()

            # 2️⃣ CREATE VARIANT
            variant = ProductVariant(
                product_id=product.id,
                sku=variant_data["sku"],
                slug=variant_data["slug"],
                name=product.name,
                stock_quantity=20,
                is_default=True,
                is_active=True,
            )

            session.add(variant)
            session.flush()

            # 3️⃣ PRICE
            session.add(
                ProductPrice(
                    variant_id=variant.id,
                    currency="INR",
                    price=Decimal(variant_data["price"]),
                )
            )

            # 4️⃣ IMAGES
            for idx, url in enumerate(variant_data["images"]):
                session.add(
                    ProductImage(
                        variant_id=variant.id,
                        image_url=url,
                        display_order=idx,
                        is_primary=(idx == 0),
                    )
                )

            # 5️⃣ ATTRIBUTES
            for attr_name, values in variant_data["attributes"].items():
                for val in values:
                    session.add(
                        ProductAttribute(
                            variant_id=variant.id,
                            name=attr_name,
                            value=val,
                        )
                    )

            # 6️⃣ ADD COLLECTION LINK (optional)
            collection = session.exec(
                select(Collection).where(Collection.name == pdata["category"])
            ).first()

            if collection:
                product.collections.append(collection)

            session.commit()
            print(f"✅ Created product: {product.name}")

        print("🎉 Product seeding complete!")


if __name__ == "__main__":
    seed_products()
