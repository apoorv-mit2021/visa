# app/api/v1/endpoints/admin/address.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, require_admin, get_current_user
from app.schemas.address import AddressRead, AddressUpdate
from app.services.address_service import AddressService
from app.models.user import User

router = APIRouter()


# ---------------------------------------------------------
# ADMIN — LIST ADDRESSES FOR ANY USER
# ---------------------------------------------------------
@router.get("/", response_model=list[AddressRead])
def list_user_addresses(
        user_id: int = Query(..., description="User ID to fetch addresses for"),
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    addresses = AddressService.list_addresses(db, user_id)
    return [AddressRead.model_validate(a) for a in addresses]


# ---------------------------------------------------------
# ADMIN — GET ONE ADDRESS
# ---------------------------------------------------------
@router.get("/{address_id}", response_model=AddressRead)
def get_address_admin(
        address_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    address = AddressService.get_address(db, address_id)
    return AddressRead.model_validate(address)
