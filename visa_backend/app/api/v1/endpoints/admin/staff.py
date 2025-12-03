# app/api/v1/endpoints/admin/staff.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_admin
from app.schemas.user import (
    StaffUserSchema,
    StaffCreateSchema,
    StaffUpdateSchema,
)
from app.services.staff_service import StaffService
from app.models.user import User

router = APIRouter()


# -----------------------------------------------------
# STAFF METRICS
# -----------------------------------------------------
@router.get("/metrics/")
def get_staff_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    return StaffService.get_staff_metrics(db)


# -----------------------------------------------------
# LIST STAFF
# -----------------------------------------------------
@router.get("/", response_model=List[StaffUserSchema])
def list_staff(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = None,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    staff_list = StaffService.list_staff(db, skip, limit, search)

    return [
        StaffUserSchema(
            id=s.id,
            full_name=s.full_name,
            email=s.email,
            is_active=s.is_active,
            is_verified=s.is_verified,
            created_at=s.created_at,
            updated_at=s.updated_at,
            roles=[r.name for r in s.roles],
        )
        for s in staff_list
    ]


# -----------------------------------------------------
# GET SINGLE STAFF
# -----------------------------------------------------
@router.get("/{staff_id}", response_model=StaffUserSchema)
def get_staff(
        staff_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    staff = StaffService.get_staff(db, staff_id)

    return StaffUserSchema(
        id=staff.id,
        full_name=staff.full_name,
        email=staff.email,
        is_active=staff.is_active,
        is_verified=staff.is_verified,
        created_at=staff.created_at,
        updated_at=staff.updated_at,
        roles=[r.name for r in staff.roles],
    )


# -----------------------------------------------------
# CREATE STAFF
# -----------------------------------------------------
@router.post("/", response_model=StaffUserSchema, status_code=status.HTTP_201_CREATED)
def create_staff(
        payload: StaffCreateSchema,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    staff = StaffService.create_staff(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
    )

    return StaffUserSchema(
        id=staff.id,
        full_name=staff.full_name,
        email=staff.email,
        is_active=staff.is_active,
        is_verified=staff.is_verified,
        created_at=staff.created_at,
        updated_at=staff.updated_at,
        roles=[r.name for r in staff.roles],
    )


# -----------------------------------------------------
# UPDATE STAFF
# -----------------------------------------------------
@router.put("/{staff_id}", response_model=StaffUserSchema)
def update_staff(
        staff_id: int,
        payload: StaffUpdateSchema,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    staff = StaffService.update_staff(
        db=db,
        staff_id=staff_id,
        data=payload.model_dump(exclude_unset=True),
    )

    return StaffUserSchema(
        id=staff.id,
        full_name=staff.full_name,
        email=staff.email,
        is_active=staff.is_active,
        is_verified=staff.is_verified,
        created_at=staff.created_at,
        updated_at=staff.updated_at,
        roles=[r.name for r in staff.roles],
    )


# -----------------------------------------------------
# DEACTIVATE STAFF
# -----------------------------------------------------
@router.delete("/{staff_id}", status_code=200)
def deactivate_staff(
        staff_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    StaffService.deactivate_staff(db, staff_id)
    return {"message": "Staff deactivated successfully"}
