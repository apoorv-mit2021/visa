# app/services/staff_service.py

from __future__ import annotations
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, Role
from app.models.case import SupportCase
from app.core.security import hash_password


class StaffService:

    # -----------------------------------------------------
    # METRICS
    # -----------------------------------------------------
    @staticmethod
    def get_staff_metrics(db: Session) -> dict:
        total_staff = (
                db.query(func.count(User.id))
                .join(User.roles)
                .filter(Role.name.in_(["staff", "admin"]))
                .scalar()
                or 0
        )

        active_staff = (
                db.query(func.count(User.id))
                .join(User.roles)
                .filter(Role.name.in_(["staff", "admin"]), User.is_active == True)
                .scalar()
                or 0
        )

        open_cases = (
                db.query(func.count(SupportCase.id))
                .filter(SupportCase.status.in_(["open", "in_progress"]))
                .scalar()
                or 0
        )

        avg_case_load = (
            round(open_cases / active_staff, 2) if active_staff else 0.0
        )

        return {
            "total_staff": total_staff,
            "active_staff": active_staff,
            "open_cases": open_cases,
            "avg_case_load_per_staff": avg_case_load,
        }

    # -----------------------------------------------------
    # LIST STAFF
    # -----------------------------------------------------
    @staticmethod
    def list_staff(
            db: Session,
            skip: int = 0,
            limit: int = 100,
            search: Optional[str] = None,
    ) -> List[User]:

        query = (
            db.query(User)
            .join(User.roles)
            .filter(Role.name.in_(["staff", "admin"]))
        )

        if search:
            like = f"%{search}%"
            query = query.filter(
                (User.full_name.ilike(like))
                | (User.email.ilike(like))
            )

        return (
            query.order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # -----------------------------------------------------
    # GET STAFF
    # -----------------------------------------------------
    @staticmethod
    def get_staff(db: Session, staff_id: int) -> User:
        user = db.query(User).filter(User.id == staff_id).first()

        if not user:
            raise HTTPException(404, "Staff not found")

        allowed_roles = {"staff", "admin"}
        user_roles = {r.name for r in user.roles}

        if not (user_roles & allowed_roles):
            raise HTTPException(400, "User is neither staff nor admin")

        return user

    # -----------------------------------------------------
    # CREATE STAFF
    # -----------------------------------------------------
    @staticmethod
    def create_staff(db: Session, full_name: str, email: str, password: str) -> User:
        # Check for duplicate email
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(400, "Email already exists")

        staff_role = db.query(Role).filter(Role.name == "staff").first()
        if not staff_role:
            raise HTTPException(404, "Staff role missing")

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            is_active=True,
            is_verified=True,
        )

        user.roles.append(staff_role)
        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    # -----------------------------------------------------
    # UPDATE STAFF
    # -----------------------------------------------------
    @staticmethod
    def update_staff(db: Session, staff_id: int, data: dict) -> User:
        staff = StaffService.get_staff(db, staff_id)

        # Update allowed fields
        for key, value in data.items():
            if key not in ["role_names", "password"]:
                setattr(staff, key, value)

        # Update password
        if "password" in data and data["password"]:
            staff.hashed_password = hash_password(data["password"])

        # Update roles if provided
        if "role_names" in data and data["role_names"]:
            roles = db.query(Role).filter(Role.name.in_(data["role_names"])).all()
            found = {r.name for r in roles}

            missing = set(data["role_names"]) - found
            if missing:
                raise HTTPException(400, f"Invalid roles: {missing}")

            staff.roles = roles

        db.commit()
        db.refresh(staff)
        return staff

    # -----------------------------------------------------
    # DEACTIVATE STAFF
    # -----------------------------------------------------
    @staticmethod
    def deactivate_staff(db: Session, staff_id: int) -> None:
        staff = StaffService.get_staff(db, staff_id)
        staff.is_active = False
        db.commit()
