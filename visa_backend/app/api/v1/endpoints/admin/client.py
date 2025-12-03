# app/api/v1/endpoints/admin/client.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user, require_staff
from app.schemas.user import ClientUserSchema, ClientAdminUpdateSchema
from app.services.client_service import ClientService
from app.models.user import User

router = APIRouter()


# -----------------------------------------------------
# CLIENT METRICS
# -----------------------------------------------------
@router.get("/metrics/")
def get_client_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)
    return ClientService.get_client_metrics(db)


# -----------------------------------------------------
# LIST CLIENTS
# -----------------------------------------------------
@router.get("/", response_model=List[ClientUserSchema])
def list_clients(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
):
    require_staff(current_user)

    clients = ClientService.list_clients(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active,
    )

    return [
        ClientUserSchema(
            id=c.id,
            full_name=c.full_name,
            email=c.email,
            is_active=c.is_active,
            is_verified=c.is_verified,
            created_at=c.created_at,
            updated_at=c.updated_at,
            roles=[r.name for r in c.roles],
        )
        for c in clients
    ]


# -----------------------------------------------------
# GET SINGLE CLIENT
# -----------------------------------------------------
@router.get("/{client_id}", response_model=ClientUserSchema)
def get_client(
        client_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    try:
        user = ClientService.get_client(db, client_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return ClientUserSchema(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[r.name for r in user.roles],
    )


# -----------------------------------------------------
# UPDATE CLIENT (ONLY is_active, is_verified)
# -----------------------------------------------------
@router.put("/{client_id}", response_model=ClientUserSchema)
def update_client(
        client_id: int,
        payload: ClientAdminUpdateSchema,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    try:
        user = ClientService.update_client(
            db=db,
            client_id=client_id,
            data=payload.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return ClientUserSchema(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[r.name for r in user.roles],
    )
