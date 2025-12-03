# app/services/address_service.py

from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.address import Address, AddressType
from app.schemas.address import (
    AddressCreate,
    AddressUpdate,
)
from app.models.user import User


class AddressService:

    # ---------------------------------------------------------
    # CREATE ADDRESS
    # ---------------------------------------------------------
    @staticmethod
    def create_address(
            db: Session,
            user_id: int,
            data: AddressCreate
    ) -> Address:

        # If default: unset existing default for same type
        if data.is_default:
            AddressService._unset_existing_default(
                db=db,
                user_id=user_id,
                address_type=data.type,
            )

        address = Address(
            user_id=user_id,
            type=data.type,
            full_name=data.full_name,
            street_address=data.street_address,
            apartment=data.apartment,
            city=data.city,
            state=data.state,
            zip_code=data.zip_code,
            country=data.country,
            is_default=data.is_default,
        )

        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    # ---------------------------------------------------------
    # GET ADDRESS (with ownership validation)
    # ---------------------------------------------------------
    @staticmethod
    def get_address(
            db: Session,
            address_id: int,
            user_id: Optional[int] = None,  # Optional: Admin mode
    ) -> Address:

        address = db.query(Address).filter(Address.id == address_id).first()

        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found",
            )

        # User-level security
        if user_id and address.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not allowed to access this address",
            )

        return address

    # ---------------------------------------------------------
    # LIST USER ADDRESSES
    # ---------------------------------------------------------
    @staticmethod
    def list_addresses(
            db: Session,
            user_id: int,
    ) -> List[Address]:
        return (
            db.query(Address)
            .filter(Address.user_id == user_id)
            .order_by(Address.created_at.desc())
            .all()
        )

    # ---------------------------------------------------------
    # UPDATE ADDRESS
    # ---------------------------------------------------------
    @staticmethod
    def update_address(
            db: Session,
            address_id: int,
            user_id: int,
            data: AddressUpdate,
    ) -> Address:

        address = AddressService.get_address(db, address_id, user_id)

        update_values = data.model_dump(exclude_unset=True)

        # If type is updated OR if default flag is set → adjust defaults
        if ("type" in update_values and update_values["type"] != address.type) or \
                ("is_default" in update_values and update_values["is_default"]):

            new_type = update_values.get("type", address.type)
            is_default = update_values.get("is_default", False)

            if is_default:
                # Unset other defaults for the new type
                AddressService._unset_existing_default(
                    db=db,
                    user_id=user_id,
                    address_type=new_type,
                )

        for key, value in update_values.items():
            setattr(address, key, value)

        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    # ---------------------------------------------------------
    # DELETE ADDRESS
    # ---------------------------------------------------------
    @staticmethod
    def delete_address(db: Session, address_id: int, user_id: int) -> None:
        address = AddressService.get_address(db, address_id, user_id)

        db.delete(address)
        db.commit()

    # ---------------------------------------------------------
    # INTERNAL: UNSET EXISTING DEFAULT FOR TYPE
    # ---------------------------------------------------------
    @staticmethod
    def _unset_existing_default(db: Session, user_id: int, address_type: str) -> None:
        """
        Ensures that each user has only one default SHIPPING and one default BILLING address.
        """
        db.query(Address).filter(
            Address.user_id == user_id,
            Address.type == address_type,
            Address.is_default == True,
        ).update({"is_default": False})

        db.commit()
