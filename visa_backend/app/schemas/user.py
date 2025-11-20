# app/schemas/user.py

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# Client
class ClientUserSchema(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: list[str]


class ClientCreateSchema(BaseModel):
    full_name: str
    email: str
    password: str


class ClientUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


# Staff
class StaffUserSchema(BaseModel):
    id: int
    full_name: str
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: list[str]


class StaffCreateSchema(BaseModel):
    full_name: str
    email: str
    password: str


class StaffUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
