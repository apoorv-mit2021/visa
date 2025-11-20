#!/usr/bin/env python3
"""
Seed base roles, permissions, and default users (admin, staff, client).
⚠️ Safe to run multiple times — won't create duplicates.
"""

import os
import sys
from sqlmodel import Session, select
from passlib.context import CryptContext

# Ensure project root is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine
from app.models.user import Role, Permission, User

# Set up bcrypt for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash plaintext password securely."""
    return pwd_context.hash(password)


def seed_roles_and_users():
    """Seed base roles, permissions, and default users."""
    # ----------------------------
    # 🧩 Role → Permission mapping
    # ----------------------------
    role_data = {
        "admin": [
            "manage_users",
            "manage_products",
            "manage_orders",
            "manage_roles",
            "view_reports",
        ],
        "staff": [
            "manage_products",
            "manage_orders",
            "view_reports",
        ],
        "client": [
            "view_products",
            "place_orders",
            "manage_account",
        ],
    }

    # ----------------------------
    # 👤 Default user accounts
    # ----------------------------
    user_data = [
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
        # 🧱 Seed Roles & Permissions
        # ---------------------------------
        existing_roles = {r.name for r in session.exec(select(Role)).all()}

        for role_name, perms in role_data.items():
            role = session.exec(select(Role).where(Role.name == role_name)).first()

            if not role:
                role = Role(
                    name=role_name,
                    description=f"{role_name.capitalize()} role with appropriate privileges",
                )
                session.add(role)
                session.commit()
                session.refresh(role)
                print(f"✅ Created role: {role_name}")
            else:
                print(f"ℹ️ Role already exists: {role_name}")

            # Attach permissions to role
            for perm_code in perms:
                perm = session.exec(select(Permission).where(Permission.code == perm_code)).first()
                if not perm:
                    perm = Permission(
                        code=perm_code,
                        description=f"Permission to {perm_code.replace('_', ' ')}",
                    )
                    session.add(perm)
                    session.commit()
                    session.refresh(perm)
                    print(f"✅ Created permission: {perm_code}")

                if perm not in role.permissions:
                    role.permissions.append(perm)

            session.add(role)
            session.commit()

        print("🎯 Roles and permissions seeded successfully.\n")

        # ---------------------------------
        # 👤 Seed Users & Assign Roles
        # ---------------------------------
        existing_users = {u.email for u in session.exec(select(User)).all()}

        for user_info in user_data:
            if user_info["email"] in existing_users:
                print(f"ℹ️ User already exists: {user_info['email']}")
                continue

            # Get role
            role = session.exec(select(Role).where(Role.name == user_info["role"])).first()
            if not role:
                print(f"⚠️ Role not found for {user_info['email']} — skipping.")
                continue

            # Create user
            user = User(
                email=user_info["email"],
                full_name=user_info["full_name"],
                hashed_password=get_password_hash(user_info["password"]),
                is_verified=True,
                is_active=True,
            )
            user.roles.append(role)

            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"✅ Created user: {user.email} (role: {role.name})")

        print("\n🎉 Seeding complete — roles, permissions, and users initialized.")


if __name__ == "__main__":
    seed_roles_and_users()
