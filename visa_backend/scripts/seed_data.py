#!/usr/bin/env python3
"""
Seed the database with sample Products, Variants, Prices, and Collections.

⚠️ Safe to run multiple times — it won’t duplicate data.
"""

import os
import sys
from decimal import Decimal
from sqlmodel import Session, select

# ✅ Ensure project root is in sys.path BEFORE imports
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


def create_sample_data():
    """Create sample products, variants, and collections"""

    # ----------------------------
    # 🛒 Sample Products
    # ----------------------------
    sample_products = [
        dict(
            name="Gold Engagement Ring",
            description="18k gold engagement ring with a solitaire diamond",
            category="Jewelry",
            sku="RING-GOLD-001",
            variants=[
                dict(
                    sku="RING-GOLD-001-6",
                    name="Size 6 / Yellow Gold",
                    stock_quantity=10,
                    is_default=True,
                    prices=[
                        dict(currency="USD", price=Decimal("799.99")),
                        dict(currency="CAD", price=Decimal("1099.99")),
                        dict(currency="EUR", price=Decimal("749.99")),
                    ],
                    attributes=[
                        dict(name="Metal", value="18k Yellow Gold"),
                        dict(name="Size", value="6"),
                    ],
                    images=[
                        dict(image_url="https://cdn.example.com/ring-gold-6-1.jpg", is_primary=True),
                        dict(image_url="https://cdn.example.com/ring-gold-6-2.jpg"),
                    ],
                ),
                dict(
                    sku="RING-GOLD-001-7",
                    name="Size 7 / White Gold",
                    stock_quantity=5,
                    is_default=False,
                    prices=[
                        dict(currency="USD", price=Decimal("829.99")),
                        dict(currency="CAD", price=Decimal("1149.99")),
                        dict(currency="EUR", price=Decimal("769.99")),
                    ],
                    attributes=[
                        dict(name="Metal", value="18k White Gold"),
                        dict(name="Size", value="7"),
                    ],
                    images=[
                        dict(image_url="https://cdn.example.com/ring-gold-7-1.jpg", is_primary=True),
                    ],
                ),
            ],
        ),
        dict(
            name="Diamond Stud Earrings",
            description="Classic diamond stud earrings in platinum",
            category="Jewelry",
            sku="EARRING-PLAT-002",
            variants=[
                dict(
                    sku="EARRING-PLAT-002-05CT",
                    name="0.5 Carat",
                    stock_quantity=15,
                    is_default=True,
                    prices=[
                        dict(currency="USD", price=Decimal("499.99")),
                        dict(currency="CAD", price=Decimal("699.99")),
                        dict(currency="EUR", price=Decimal("469.99")),
                    ],
                    attributes=[
                        dict(name="Material", value="Platinum"),
                        dict(name="Carat", value="0.5"),
                    ],
                    images=[
                        dict(image_url="https://cdn.example.com/earring-05ct-1.jpg", is_primary=True),
                    ],
                ),
            ],
        ),
    ]

    # ----------------------------
    # 🧩 Sample Collections
    # ----------------------------
    sample_collections = [
        Collection(
            name="Men's Collection",
            slug="mens-collection",
            description="Sophisticated jewelry and accessories designed for men.",
        ),
        Collection(
            name="Women's Collection",
            slug="womens-collection",
            description="Elegant and timeless pieces crafted for women.",
        ),
        Collection(
            name="Rings",
            slug="rings",
            description="Exquisite rings for engagements, weddings, and special occasions.",
        ),
        Collection(
            name="Necklaces",
            slug="necklaces",
            description="Beautiful necklaces made from gold, platinum, and silver.",
        ),
        Collection(
            name="Bracelets",
            slug="bracelets",
            description="Stylish bracelets featuring diamonds, gemstones, and precious metals.",
        ),
        Collection(
            name="Earrings",
            slug="earrings",
            description="Delicately designed earrings perfect for every style.",
        ),
    ]

    # ----------------------------
    # 💾 Insert Data
    # ----------------------------
    with Session(engine) as session:
        # Create collections if not present
        existing_slugs = set(session.exec(select(Collection.slug)).all())
        new_collections = [c for c in sample_collections if c.slug not in existing_slugs]
        if new_collections:
            session.add_all(new_collections)
            session.commit()
            print(f"✅ Created {len(new_collections)} new collections.")
        else:
            print("ℹ️  Collections already exist.")

        # Create products if not present
        existing_skus = set(session.exec(select(Product.sku)).all())
        for product_data in sample_products:
            if product_data["sku"] in existing_skus:
                continue

            product = Product(
                name=product_data["name"],
                description=product_data["description"],
                category=product_data["category"],
                sku=product_data["sku"],
            )

            # Add variants
            for vdata in product_data["variants"]:
                variant = ProductVariant(
                    sku=vdata["sku"],
                    name=vdata["name"],
                    stock_quantity=vdata["stock_quantity"],
                    is_default=vdata["is_default"],
                )

                # Prices
                for pdata in vdata["prices"]:
                    price = ProductPrice(
                        currency=pdata["currency"],
                        price=pdata["price"],
                    )
                    variant.prices.append(price)

                # Attributes
                for adata in vdata["attributes"]:
                    attr = ProductAttribute(
                        name=adata["name"],
                        value=adata["value"],
                    )
                    variant.attributes.append(attr)

                # Images
                for idata in vdata["images"]:
                    img = ProductImage(
                        image_url=idata["image_url"],
                        is_primary=idata.get("is_primary", False),
                    )
                    variant.images.append(img)

                product.variants.append(variant)

            session.add(product)
            session.commit()
            print(f"💎 Added product: {product.name}")

        # 🔗 Link to collections (by keyword in name)
        products = session.exec(select(Product)).all()
        collections = {c.slug: c for c in session.exec(select(Collection)).all()}

        for product in products:
            if "ring" in product.name.lower() and "rings" in collections:
                collections["rings"].products.append(product)
            elif "earring" in product.name.lower() and "earrings" in collections:
                collections["earrings"].products.append(product)

        session.commit()
        print("🔗 Linked products to collections successfully.")

        print("🎉 Seeding complete!")


if __name__ == "__main__":
    create_sample_data()
