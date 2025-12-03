# app/schemas/address.py

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.address import AddressType
from app.models.base import BaseRead


# -----------------------------------------------------
# BASE SCHEMA
# -----------------------------------------------------
class AddressBase(BaseModel):
    type: str = Field(default=AddressType.SHIPPING)
    full_name: str
    street: str
    apartment: Optional[str] = None
    city: str
    state: str
    zip: str
    country: str
    is_default: bool = False


# -----------------------------------------------------
# CREATE SCHEMA
# -----------------------------------------------------
class AddressCreate(AddressBase):
    pass


# -----------------------------------------------------
# UPDATE SCHEMA
# -----------------------------------------------------
class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    street: Optional[str] = None
    apartment: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


# -----------------------------------------------------
# READ SCHEMA
# -----------------------------------------------------
class AddressRead(AddressBase, BaseRead):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
