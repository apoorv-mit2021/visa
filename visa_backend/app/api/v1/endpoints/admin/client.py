# app/api/v1/endpoints/admin/client.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func

from app.core.deps import get_session, get_current_user, require_staff
from app.models import User, Role, Order
from app.schemas.user import ClientUserSchema, ClientCreateSchema, ClientUpdateSchema

router = APIRouter()


# CLIENT METRICS
@router.get("/metrics/")
def get_client_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    total_clients = session.exec(
        select(func.count(User.id))
        .join(User.roles)
        .where(Role.name == "client")
    ).one()

    verified_clients = session.exec(
        select(func.count(User.id))
        .join(User.roles)
        .where(Role.name == "client", User.is_verified == True)
    ).one()

    total_orders = session.exec(
        select(func.count(Order.id))
        .join(User, Order.user_id == User.id)
        .join(User.roles)
        .where(Role.name == "client")
    ).one()

    avg = round(total_orders / total_clients, 2) if total_clients else 0.0

    return {
        "total_clients": total_clients,
        "verified_clients": verified_clients,
        "total_orders": total_orders,
        "avg_orders_per_client": avg,
    }


# LIST CLIENTS
@router.get("/", response_model=List[ClientUserSchema])
def list_clients(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
):
    require_staff(current_user)

    query = (
        select(User)
        .join(User.roles)
        .where(Role.name == "client")
    )

    if search:
        like = f"%{search}%"
        query = query.where(User.full_name.ilike(like) | User.email.ilike(like))

    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)

    clients = session.exec(query).all()
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


# GET SINGLE CLIENT
@router.get("/{client_id}", response_model=ClientUserSchema)
def get_client(
        client_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    require_staff(current_user)

    user = session.get(User, client_id)
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")

    if "client" not in [r.name for r in user.roles]:
        raise HTTPException(status_code=400, detail="User is not a client")

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
