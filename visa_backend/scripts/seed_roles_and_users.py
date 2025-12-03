#!/usr/bin/env python3
"""
Seed base roles and default users (admin, staff, client).
⚠️ Safe to run multiple times — won't create duplicates.
"""

import os
import sys
from sqlmodel import Session, select
from passlib.context import CryptContext

# Ensure the project root is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine
from app.models.user import Role, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def seed_roles_and_users():
    """Seed base roles and default users."""
    roles_to_create = ["admin", "staff", "client"]

    default_users = [
        {
            "email": "admin@demo.com",
            "full_name": "Admin User",
            "password": "admin123",
            "role": "admin",
        },
        {
            "email": "staff@demo.com",
            "full_name": "Staff Member",
            "password": "staff123",
            "role": "staff",
        },
        {
            "email": "client@demo.com",
            "full_name": "Client User",
            "password": "client123",
            "role": "client",
        },
    ]

    with Session(engine) as session:
        # ---------------------------------
        # 🧱 Seed Roles
        # ---------------------------------
        existing_roles = {r.name for r in session.exec(select(Role)).all()}

        for role_name in roles_to_create:
            if role_name not in existing_roles:
                role = Role(
                    name=role_name,
                    description=f"{role_name.capitalize()} role",
                )
                session.add(role)
                session.commit()
                print(f"✅ Created role: {role_name}")
            else:
                print(f"ℹ️ Role already exists: {role_name}")

        print("\n🎯 Roles seeded successfully.\n")

        # ---------------------------------
        # 👤 Seed Users
        # ---------------------------------
        existing_users = {u.email for u in session.exec(select(User)).all()}

        for user_info in default_users:
            if user_info["email"] in existing_users:
                print(f"ℹ️ User already exists: {user_info['email']}")
                continue

            # Fetch role
            role = session.exec(
                select(Role).where(Role.name == user_info["role"])
            ).first()

            if not role:
                print(f"⚠️ Role {user_info['role']} missing — skipped")
                continue

            # Create user
            user = User(
                email=user_info["email"],
                full_name=user_info["full_name"],
                hashed_password=hash_password(user_info["password"]),
                is_verified=True,
                is_active=True,
            )

            user.roles.append(role)

            session.add(user)
            session.commit()
            session.refresh(user)

            print(f"✅ Created user: {user.email} (role: {role.name})")

        print("\n🎉 Seeding complete — roles and users initialized.")


if __name__ == "__main__":
    seed_roles_and_users()
