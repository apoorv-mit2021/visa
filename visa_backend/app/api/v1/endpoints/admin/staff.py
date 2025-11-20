# app/api/v1/endpoints/admin/staff.py

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from app.core.deps import get_current_user, require_admin, get_session
from app.core.security import hash_password
from app.models import User, Role, SupportCase
from app.schemas.user import StaffUserSchema, StaffCreateSchema, StaffUpdateSchema

router = APIRouter()


# STAFF METRICS
@router.get("/metrics/")
def get_staff_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(require_admin),
):
    require_admin(current_user)

    total_staff = session.exec(
        select(func.count(User.id))
        .join(User.roles)
        .where(Role.name == "staff")
    ).one()

    active_staff = session.exec(
        select(func.count(User.id))
        .join(User.roles)
        .where(Role.name == "staff", User.is_active == True)
    ).one()

    open_cases = session.exec(
        select(func.count(SupportCase.id))
        .where(SupportCase.status.in_(["open", "in_progress"]))
    ).one()

    avg_case_load = round(open_cases / active_staff, 2) if active_staff else 0.0

    return {
        "total_staff": total_staff,
        "active_staff": active_staff,
        "open_cases": open_cases,
        "avg_case_load_per_staff": avg_case_load,
    }


# LIST STAFF
@router.get("/", response_model=List[StaffUserSchema])
def list_staff(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = None,
):
    require_admin(current_user)

    query = (
        select(User)
        .join(User.roles)
        .where(Role.name == "staff")
    )

    if search:
        like = f"%{search}%"
        query = query.where(User.full_name.ilike(like) | User.email.ilike(like))

    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)

    staff = session.exec(query).all()
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
        for s in staff
    ]


# GET SINGLE STAFF
@router.get("/{staff_id}", response_model=StaffUserSchema)
def get_staff(
        staff_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    staff = session.get(User, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if "staff" not in [r.name for r in staff.roles]:
        raise HTTPException(status_code=400, detail="User is not a staff member")

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


# CREATE STAFF
@router.post("/", response_model=StaffUserSchema, status_code=status.HTTP_201_CREATED)
def create_staff(
        payload: StaffCreateSchema,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    if session.exec(select(User).where(User.email == payload.email)).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    staff_role = session.exec(select(Role).where(Role.name == "staff")).first()
    if not staff_role:
        raise HTTPException(status_code=404, detail="Staff role missing")

    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_verified=True,
        is_active=True,
    )

    new_user.roles.append(staff_role)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return StaffUserSchema(
        id=new_user.id,
        full_name=new_user.full_name,
        email=new_user.email,
        is_active=new_user.is_active,
        is_verified=new_user.is_verified,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
        roles=[r.name for r in new_user.roles],
    )


# UPDATE STAFF
@router.put("/{staff_id}", response_model=StaffUserSchema)
def update_staff(
        staff_id: int,
        payload: StaffUpdateSchema,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    staff = session.get(User, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if not any(r.name == "staff" for r in staff.roles):
        raise HTTPException(status_code=400, detail="User is not a staff member")

    for key, value in payload.model_dump(exclude_unset=True).items():
        if key not in ["role_names", "password"]:
            setattr(staff, key, value)

    if payload.role_names:
        new_roles = session.exec(
            select(Role).where(Role.name.in_(payload.role_names))
        ).all()

        missing = set(payload.role_names) - {r.name for r in new_roles}
        if missing:
            raise HTTPException(status_code=400, detail=f"Invalid roles: {missing}")

        staff.roles = new_roles

    session.add(staff)
    session.commit()
    session.refresh(staff)

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


# DEACTIVATE STAFF
@router.delete("/{staff_id}", status_code=status.HTTP_200_OK)
def delete_staff(
        staff_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_admin(current_user)

    staff = session.get(User, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    if not any(r.name == "staff" for r in staff.roles):
        raise HTTPException(status_code=400, detail="User is not a staff member")

    staff.is_active = False
    session.add(staff)
    session.commit()

    return {"message": f"Staff '{staff.email}' deactivated successfully"}
