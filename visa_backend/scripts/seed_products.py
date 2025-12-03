#!/usr/bin/env python3
"""
Seed the database with sample products and initial inventory.

This script is safe to run multiple times.
"""

import os
import sys
from sqlmodel import Session, select
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine
from app.models.catalog import Product, Collection
from app.models.inventory import Inventory

# ------------------------------------------------
# SAMPLE PRODUCTS (UPDATED FOR CURRENT MODEL)
# ------------------------------------------------
sample_products = [
    {
        "sku": "SKU-ESD-001",
        "name": "Eternal Solitaire Diamond Ring",
        "slug": "eternal-solitaire-diamond-ring",
        "description": "A timeless masterpiece featuring a brilliant 1.5-carat diamond.",
        "category": "Rings",
        "price": 8999,
        "currency": "CAD",

        "sizes": {"6": 5, "7": 2, "8": 1},
        "product_details": {
            "Material": "Platinum 950",
            "Stone": "Diamond",
            "Color": "White",
            "Carat": "1.5ct",
            "Clarity": "VVS1",
            "Cut": "Excellent",
        },
        "care_instructions": [
            "Clean with mild soap",
            "Avoid direct impact",
            "Store in a soft pouch"
        ],
        "images": [
            "https://cdn.example.com/images/ring1.png",
            "https://cdn.example.com/images/ring2.png"
        ],

        "initial_stock": 20,
    },
    {
        "sku": "SKU-PEN-002",
        "name": "Pearl Elegance Necklace",
        "slug": "pearl-elegance-necklace",
        "description": "A sophisticated necklace made with South Sea pearls.",
        "category": "Necklaces",
        "price": 4299,
        "currency": "CAD",

        "sizes": {"18 inch": 10},
        "product_details": {
            "Material": "18K Gold",
            "Stone": "Pearl",
            "Pearl Type": "South Sea",
            "Color": "White",
        },
        "care_instructions": [
            "Avoid chemicals",
            "Wipe with a soft cloth"
        ],
        "images": [
            "https://cdn.example.com/images/necklace1.png"
        ],

        "initial_stock": 15,
    },
    {
        "sku": "SKU-RGB-003",
        "name": "Rose Gold Tennis Bracelet",
        "slug": "rose-gold-tennis-bracelet",
        "description": "Tennis bracelet crafted with brilliant diamonds.",
        "category": "Bracelets",
        "price": 5799,
        "currency": "CAD",

        "sizes": {"7 inch": 3},
        "product_details": {
            "Material": "18K Rose Gold",
            "Stone": "Diamond",
            "Color": "Rose Gold",
        },
        "care_instructions": [
            "Clean with soft brush",
            "Store separately"
        ],
        "images": [
            "https://cdn.example.com/images/bracelet1.png"
        ],

        "initial_stock": 12,
    },
]


# ------------------------------------------------
# SEED FUNCTION
# ------------------------------------------------
def seed_products():
    with Session(engine) as session:

        existing_slugs = {p.slug for p in session.exec(select(Product)).all()}

        for pdata in sample_products:

            if pdata["slug"] in existing_slugs:
                print(f"ℹ️ Skipping (already exists): {pdata['name']}")
                continue

            initial_stock = pdata.pop("initial_stock")

            # ---------------------------
            # 1️⃣ CREATE PRODUCT
            # ---------------------------
            product = Product(
                sku=pdata["sku"],
                name=pdata["name"],
                slug=pdata["slug"],
                description=pdata["description"],
                category=pdata["category"],
                price=pdata["price"],
                currency=pdata["currency"],

                sizes=pdata["sizes"],
                product_details=pdata["product_details"],
                care_instructions=pdata["care_instructions"],
                images=pdata["images"],

                is_active=True,
            )

            session.add(product)
            session.flush()
            session.commit()
            print(f"✅ Created product: {product.name}")

        print("🎉 Product seeding complete!")


# ------------------------------------------------
# ENTRYPOINT
# ------------------------------------------------
if __name__ == "__main__":
    seed_products()
