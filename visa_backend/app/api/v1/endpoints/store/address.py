from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from app.db import get_session
from app.models import Address, AddressCreate, AddressUpdate, AddressRead, User
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_address(
        address_data: AddressCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Add a new address (shipping or billing) for the current user"""
    # If setting as default, unset previous default for same type
    if address_data.is_default:
        existing_defaults = session.exec(
            select(Address).where(Address.user_id == current_user.id, Address.type == address_data.type)
        ).all()
        for addr in existing_defaults:
            addr.is_default = False
            session.add(addr)

    address = Address(user_id=current_user.id, **address_data.model_dump())
    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.get("/", response_model=List[AddressRead])
def list_addresses(
        address_type: Optional[str] = Query(None, description="Filter by type: shipping or billing"),
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """List all addresses for the logged-in user"""
    query = select(Address).where(Address.user_id == current_user.id)
    if address_type:
        query = query.where(Address.type == address_type)
    return session.exec(query).all()


@router.get("/{address_id}", response_model=AddressRead)
def get_address(
        address_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Get a specific address by ID"""
    address = session.get(Address, address_id)
    if not address or address.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Address not found")
    return address


@router.put("/{address_id}", response_model=AddressRead)
def update_address(
        address_id: int,
        address_update: AddressUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Update an address"""
    address = session.get(Address, address_id)
    if not address or address.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Address not found")

    for key, value in address_update.model_dump(exclude_unset=True).items():
        setattr(address, key, value)

    # Handle default change
    if address_update.is_default:
        other_defaults = session.exec(
            select(Address).where(
                Address.user_id == current_user.id,
                Address.type == address.type,
                Address.id != address.id,
            )
        ).all()
        for addr in other_defaults:
            addr.is_default = False
            session.add(addr)

    session.add(address)
    session.commit()
    session.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_200_OK)
def delete_address(
        address_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Delete a user address"""
    address = session.get(Address, address_id)
    if not address or address.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Address not found")

    session.delete(address)
    session.commit()
    return {"message": "Address deleted successfully"}
