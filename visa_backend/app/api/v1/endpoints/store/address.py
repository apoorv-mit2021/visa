# app/api/v1/endpoints/store/address.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.models.user import User
from app.schemas.address import (
    AddressCreate,
    AddressUpdate,
    AddressRead,
)
from app.services.address_service import AddressService

router = APIRouter()


# ---------------------------------------------------------
# STORE — LIST USER ADDRESSES
# ---------------------------------------------------------
@router.get("/", response_model=list[AddressRead])
def list_my_addresses(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    addresses = AddressService.list_addresses(db, current_user.id)
    return [AddressRead.model_validate(a) for a in addresses]


# ---------------------------------------------------------
# STORE — CREATE ADDRESS
# ---------------------------------------------------------
@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_my_address(
        payload: AddressCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    address = AddressService.create_address(db, current_user.id, payload)
    return AddressRead.model_validate(address)


# ---------------------------------------------------------
# STORE — UPDATE USER ADDRESS
# ---------------------------------------------------------
@router.put("/{address_id}", response_model=AddressRead)
def update_my_address(
        address_id: int,
        payload: AddressUpdate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    address = AddressService.update_address(
        db=db,
        address_id=address_id,
        user_id=current_user.id,
        data=payload,
    )
    return AddressRead.model_validate(address)


# ---------------------------------------------------------
# STORE — DELETE USER ADDRESS
# ---------------------------------------------------------
@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_address(
        address_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    AddressService.delete_address(db, address_id, current_user.id)
    return None
