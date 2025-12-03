# app/services/client_service.py

from __future__ import annotations
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, Role
from app.models.order import Order


class ClientService:

    # -----------------------------------------------------
    # METRICS
    # -----------------------------------------------------
    @staticmethod
    def get_client_metrics(db: Session) -> dict:
        total_clients = (
                db.query(func.count(User.id))
                .join(User.roles)
                .filter(Role.name == "client")
                .scalar()
                or 0
        )

        verified_clients = (
                db.query(func.count(User.id))
                .join(User.roles)
                .filter(Role.name == "client", User.is_verified == True)
                .scalar()
                or 0
        )

        total_orders = (
                db.query(func.count(Order.id))
                .join(User, User.id == Order.user_id)
                .join(User.roles)
                .filter(Role.name == "client")
                .scalar()
                or 0
        )

        avg_orders = round(total_orders / total_clients, 2) if total_clients else 0.0

        return {
            "total_clients": total_clients,
            "verified_clients": verified_clients,
            "total_orders": total_orders,
            "avg_orders_per_client": avg_orders,
        }

    # -----------------------------------------------------
    # LIST CLIENTS
    # -----------------------------------------------------
    @staticmethod
    def list_clients(
            db: Session,
            skip: int = 0,
            limit: int = 100,
            search: Optional[str] = None,
            is_active: Optional[bool] = None,
    ) -> List[User]:

        query = (
            db.query(User)
            .join(User.roles)
            .filter(Role.name == "client")
        )

        if search:
            like = f"%{search}%"
            query = query.filter(
                (User.full_name.ilike(like)) | (User.email.ilike(like))
            )

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        return (
            query.order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # -----------------------------------------------------
    # GET SINGLE CLIENT
    # -----------------------------------------------------
    @staticmethod
    def get_client(db: Session, client_id: int) -> User:
        user = db.query(User).filter(User.id == client_id).first()

        if not user:
            raise ValueError("Client not found")

        if "client" not in [r.name for r in user.roles]:
            raise ValueError("User is not a client")

        return user

    # -----------------------------------------------------
    # UPDATE CLIENT (ADMIN-ONLY)
    # -----------------------------------------------------
    @staticmethod
    def update_client(db: Session, client_id: int, data: dict) -> User:
        """Update only allowed fields for a client: is_active, is_verified."""
        user = ClientService.get_client(db, client_id)

        allowed_fields = {"is_active", "is_verified"}
        for key, value in data.items():
            if key in allowed_fields:
                setattr(user, key, value)

        db.commit()
        db.refresh(user)
        return user
