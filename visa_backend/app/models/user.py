# app/models/user.py

from __future__ import annotations
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import (
    Column,
    String,
    Boolean,
    Table,
    ForeignKey,
)
from sqlalchemy.orm import relationship, Mapped

from app.models.base import Base, BaseTableMixin

if TYPE_CHECKING:
    from app.models.address import Address
    from app.models.order import Order
    from app.models.inventory import Inventory
    from app.models.case import SupportCase
    from app.models.cart import Cart
    from app.models.wishlist import Wishlist

# -----------------------------------------------------
# MANY-TO-MANY: USER ↔ ROLE
# -----------------------------------------------------
user_role_link = Table(
    "user_role_link",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
)


# -----------------------------------------------------
# ROLE MODEL
# -----------------------------------------------------
class Role(Base, BaseTableMixin):
    """
    Represents a user role (admin, staff, user).
    No permissions system — pure role-based access.
    """
    __tablename__ = "roles"

    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_role_link,
        back_populates="roles",
        lazy="selectin",
    )


# -----------------------------------------------------
# USER MODEL
# -----------------------------------------------------
class User(Base, BaseTableMixin):
    """Represents a user (customer, staff, or admin)."""
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_verified = Column(Boolean, default=False, nullable=False)

    # MANY-TO-MANY: User ↔ Roles
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary=user_role_link,
        back_populates="users",
        lazy="selectin",
    )

    # ONE-TO-MANY RELATIONSHIPS
    addresses: Mapped[List["Address"]] = relationship(
        "Address",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    orders: Mapped[List["Order"]] = relationship(
        "Order",
        back_populates="user",
        lazy="selectin",
    )

    inventory_actions: Mapped[List["Inventory"]] = relationship(
        "Inventory",
        back_populates="performed_by",
        lazy="selectin",
    )

    cases_raised: Mapped[List["SupportCase"]] = relationship(
        "SupportCase",
        back_populates="user",
        lazy="selectin",
        foreign_keys="SupportCase.user_id",
    )

    cases_assigned: Mapped[List["SupportCase"]] = relationship(
        "SupportCase",
        back_populates="assigned_to",
        lazy="selectin",
        foreign_keys="SupportCase.assigned_to_id",
    )

    # ONE-TO-ONE RELATIONSHIPS
    cart: Mapped[Optional["Cart"]] = relationship(
        "Cart",
        back_populates="user",
        lazy="selectin",
        uselist=False,
    )

    wishlist: Mapped[Optional["Wishlist"]] = relationship(
        "Wishlist",
        back_populates="user",
        lazy="selectin",
        uselist=False,
    )
