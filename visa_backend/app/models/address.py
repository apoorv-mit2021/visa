from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from .base import BaseTable, BaseRead
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .order import Order


class AddressType:
    SHIPPING = "shipping"
    BILLING = "billing"


class Address(BaseTable, table=True):
    """Stores user addresses for shipping and billing"""
    __tablename__ = "addresses"

    user_id: int = Field(foreign_key="users.id", index=True)
    type: str = Field(default=AddressType.SHIPPING, description="shipping or billing")
    full_name: str = Field(max_length=255)
    street_address: str = Field(max_length=255)
    apartment: Optional[str] = Field(default=None, max_length=100)
    city: str = Field(max_length=100)
    state: str = Field(max_length=100)
    zip_code: str = Field(max_length=20)
    country: str = Field(max_length=100)
    is_default: bool = Field(default=False, description="Is this the default address for its type")

    user: "User" = Relationship(back_populates="addresses", sa_relationship_kwargs={"lazy": "selectin"})


# -----------------------------
# SCHEMAS
# -----------------------------

class AddressBase(SQLModel):
    type: str = Field(default=AddressType.SHIPPING)
    full_name: str
    street_address: str
    apartment: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(SQLModel):
    full_name: Optional[str] = None
    street_address: Optional[str] = None
    apartment: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressRead(BaseRead):
    id: int
    user_id: int
    type: str
    full_name: str
    street_address: str
    apartment: Optional[str]
    city: str
    state: str
    zip_code: str
    country: str
    is_default: bool
