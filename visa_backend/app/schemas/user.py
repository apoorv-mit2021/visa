# app/schemas/user.py

from __future__ import annotations
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field

from app.models.base import BaseRead


# -----------------------------------------------------
# ROLE SCHEMAS (simple RBAC — no permissions)
# -----------------------------------------------------
class RoleRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------
# GENERIC USER SCHEMAS (ADMIN-FACING)
# -----------------------------------------------------
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    is_verified: bool = False


class UserCreate(UserBase):
    password: str
    role_names: List[str] = Field(
        default_factory=list,
        description="Roles to assign (e.g. ['admin', 'staff', 'user'])",
    )


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_verified: Optional[bool] = None
    role_names: Optional[List[str]] = Field(
        default=None,
        description="Roles to assign (e.g. ['admin', 'staff', 'user'])",
    )


class UserRead(UserBase, BaseRead):
    id: int
    is_active: bool
    roles: Optional[List[RoleRead]] = None

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------
# CLIENT-FACING SCHEMAS (PUBLIC USERS)
# -----------------------------------------------------
class ClientUserSchema(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: List[str]  # simplified role list for frontend

    # We manually control mapping for client responses.
    model_config = ConfigDict(from_attributes=False)


class ClientCreateSchema(BaseModel):
    full_name: str
    email: str
    password: str


class ClientUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


# -----------------------------------------------------
# STAFF-FACING SCHEMAS (ADMIN PANEL)
# -----------------------------------------------------
class StaffUserSchema(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: List[str]

    model_config = ConfigDict(from_attributes=False)


class StaffCreateSchema(BaseModel):
    full_name: str
    email: str
    password: str


class StaffUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class ClientAdminUpdateSchema(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
