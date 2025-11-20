#!/usr/bin/env python3
"""
Reset the database: drop all tables and recreate them.

⚠️ WARNING: This will delete ALL data in the database.
Use only in development or testing.
"""

import os
import sys

# ✅ Ensure project root is in sys.path BEFORE any imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import SQLModel
from app.db import engine
from app import models  # optional, to ensure all models are registered
from scripts.seed_roles_and_users import seed_roles_and_users
from scripts.seed_collections import seed_collections
from scripts.seed_products import seed_products


def reset_database():
    print("⚠️  WARNING: This will delete all data and recreate tables.")
    confirm = input("Type 'yes' to continue: ").strip().lower()
    if confirm != "yes":
        print("❌ Operation cancelled.")
        sys.exit(0)

    print("🗑  Dropping all tables...")
    SQLModel.metadata.drop_all(bind=engine)

    print("🛠  Recreating tables...")
    SQLModel.metadata.create_all(bind=engine)

    print("✅ Database reset complete.")
    seed_roles_and_users()
    seed_collections()
    # seed_products()


if __name__ == "__main__":
    reset_database()
