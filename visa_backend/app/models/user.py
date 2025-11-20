from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .address import Address
    from .cart import Cart
    from .wishlist import Wishlist
    from .order import Order
    from .case import SupportCase
    from .inventory import Inventory


# -----------------------------
# LINK TABLES
# -----------------------------

class UserRoleLink(SQLModel, table=True):
    """Link table between users and roles"""
    __tablename__ = "user_role_link"

    user_id: int = Field(foreign_key="users.id", primary_key=True)
    role_id: int = Field(foreign_key="roles.id", primary_key=True)


class RolePermissionLink(SQLModel, table=True):
    """Link table between roles and permissions"""
    __tablename__ = "role_permission_link"

    role_id: int = Field(foreign_key="roles.id", primary_key=True)
    permission_id: int = Field(foreign_key="permissions.id", primary_key=True)


# -----------------------------
# ROLE MODEL
# -----------------------------

class Role(BaseTable, table=True):
    """User roles (e.g., admin, staff, user)"""
    __tablename__ = "roles"

    name: str = Field(index=True, unique=True, min_length=1, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)

    permissions: List["Permission"] = Relationship(
        back_populates="roles",
        link_model=RolePermissionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    users: List["User"] = Relationship(
        back_populates="roles",
        link_model=UserRoleLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )


# -----------------------------
# PERMISSION MODEL
# -----------------------------

class Permission(BaseTable, table=True):
    """Granular actions tied to roles"""
    __tablename__ = "permissions"

    code: str = Field(unique=True, index=True, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)

    roles: List["Role"] = Relationship(
        back_populates="permissions",
        link_model=RolePermissionLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )


# -----------------------------
# USER MODEL
# -----------------------------

class User(BaseTable, table=True):
    """Represents a user (customer, staff, or admin)"""
    __tablename__ = "users"

    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    full_name: Optional[str] = Field(default=None, max_length=100)
    is_verified: bool = Field(default=False)

    # Many-to-many: User ↔ Roles
    roles: List["Role"] = Relationship(
        back_populates="users",
        link_model=UserRoleLink,
        sa_relationship_kwargs={"lazy": "selectin"},
    )

    addresses: List["Address"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"},
    )

    # Other relationships
    cart: Optional["Cart"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    orders: List["Order"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    wishlist: Optional["Wishlist"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})

    inventory_actions: List["Inventory"] = Relationship(
        back_populates="performed_by",
        sa_relationship_kwargs={"lazy": "selectin"}
    )

    # Support Cases
    cases_raised: List["SupportCase"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[SupportCase.user_id]",
        },
    )
    cases_assigned: List["SupportCase"] = Relationship(
        back_populates="assigned_to",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[SupportCase.assigned_to_id]",
        },
    )


# -----------------------------
# SCHEMAS
# -----------------------------

class PermissionRead(BaseRead):
    id: int
    code: str
    description: Optional[str]


class RoleRead(BaseRead):
    id: int
    name: str
    description: Optional[str]
    permissions: Optional[List[PermissionRead]] = None


class UserBase(SQLModel):
    email: str
    full_name: Optional[str] = None
    is_verified: bool = False


class UserCreate(UserBase):
    password: str
    role_names: Optional[List[str]] = Field(
        default_factory=list, description="Roles to assign (admin/staff/user)"
    )


class UserUpdate(UserBase):
    role_names: Optional[List[str]] = Field(
        default_factory=list, description="Roles to assign (admin/staff/user)"
    )


class UserRead(UserBase, BaseRead):
    id: int
    is_active: bool
    roles: Optional[List[RoleRead]] = None
