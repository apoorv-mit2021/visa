from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import Address, AddressRead, User
from app.core.deps import get_current_user, require_admin

router = APIRouter()


@router.get("/", response_model=List[AddressRead])
def list_all_addresses(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Admin view: list all addresses"""
    require_admin(current_user)
    return session.exec(select(Address)).all()
