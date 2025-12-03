#!/usr/bin/env python3
"""
Seed the database with core product collections.
Safe to run multiple times.
"""

import os
import sys

from sqlalchemy.orm import Session
from sqlalchemy import select

# Ensure project root is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.models.catalog import Collection


def seed_collections():
    sample_collections = [
        {
            "name": "Men's Collection",
            "slug": "mens-collection",
            "description": "Sophisticated jewelry and accessories designed for men.",
        },
        {
            "name": "Women's Collection",
            "slug": "womens-collection",
            "description": "Elegant and timeless pieces crafted for women.",
        },
        {
            "name": "Rings",
            "slug": "rings",
            "description": "Exquisite rings for engagements, weddings, and special occasions.",
        },
        {
            "name": "Necklaces",
            "slug": "necklaces",
            "description": "Beautiful necklaces made from gold, platinum, and silver.",
        },
        {
            "name": "Bracelets",
            "slug": "bracelets",
            "description": "Stylish bracelets featuring diamonds, gemstones, and precious metals.",
        },
        {
            "name": "Earrings",
            "slug": "earrings",
            "description": "Delicately designed earrings perfect for every style.",
        },
    ]

    with Session(engine) as session:
        existing_slugs = {
            c.slug for c in session.execute(select(Collection)).scalars().all()
        }

        to_create = [
            Collection(**c)
            for c in sample_collections
            if c["slug"] not in existing_slugs
        ]

        if to_create:
            session.add_all(to_create)
            session.commit()
            print(f"✅ Created {len(to_create)} new collections.")
        else:
            print("ℹ️ No new collections to create.")

        print("🎉 Collections seeding complete.")


if __name__ == "__main__":
    seed_collections()
