# app/services/support_case_service.py

from __future__ import annotations
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.case import SupportCase, CaseMessage, CaseStatus
from app.schemas.case import SupportMetrics
from app.schemas.case import SupportCaseCreate, SupportCaseUpdate, CaseMessageCreate


class SupportCaseService:

    # -----------------------------------------------------
    # CREATE CASE (CLIENT)
    # -----------------------------------------------------
    @staticmethod
    def create_case(db: Session, user_id: int, data: SupportCaseCreate) -> SupportCase:
        case = SupportCase(
            user_id=user_id,
            order_id=data.order_id,
            subject=data.subject,
            description=data.description,
            status=CaseStatus.OPEN,
        )

        db.add(case)
        db.commit()
        db.refresh(case)
        return case

    # -----------------------------------------------------
    # GET CASE (ADMIN or OWNER)
    # -----------------------------------------------------
    @staticmethod
    def get_case(db: Session, case_id: int) -> SupportCase:
        case = db.query(SupportCase).filter(SupportCase.id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return case

    # -----------------------------------------------------
    # LIST ALL CASES (ADMIN)
    # -----------------------------------------------------
    @staticmethod
    def list_cases(
            db: Session,
            status: Optional[str] = None,
            search: Optional[str] = None,
            skip: int = 0,
            limit: int = 100,
    ):

        query = db.query(SupportCase)

        if status:
            query = query.filter(SupportCase.status == status)

        if search:
            like = f"%{search}%"
            query = query.filter(SupportCase.subject.ilike(like))

        return (
            query.order_by(SupportCase.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # -----------------------------------------------------
    # LIST USER CASES (STORE)
    # -----------------------------------------------------
    @staticmethod
    def list_user_cases(
            db: Session, user_id: int
    ) -> List[SupportCase]:
        return (
            db.query(SupportCase)
            .filter(SupportCase.user_id == user_id)
            .order_by(SupportCase.created_at.desc())
            .all()
        )

    # -----------------------------------------------------
    # UPDATE CASE (ADMIN)
    # -----------------------------------------------------
    @staticmethod
    def update_case(
            db: Session,
            case_id: int,
            data: SupportCaseUpdate
    ) -> SupportCase:

        case = SupportCaseService.get_case(db, case_id)

        update_data = data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(case, key, value)

        db.commit()
        db.refresh(case)
        return case

    # -----------------------------------------------------
    # ADD MESSAGE TO CASE (ADMIN OR CLIENT)
    # -----------------------------------------------------
    @staticmethod
    def add_message(
            db: Session,
            case_id: int,
            sender_id: int,
            data: CaseMessageCreate,
    ) -> CaseMessage:

        case = SupportCaseService.get_case(db, case_id)

        message = CaseMessage(
            case_id=case.id,
            sender_id=sender_id,
            message=data.message,
        )

        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    # -----------------------------------------------------
    # CLOSE CASE (ADMIN)
    # -----------------------------------------------------
    @staticmethod
    def close_case(db: Session, case_id: int) -> SupportCase:
        case = SupportCaseService.get_case(db, case_id)
        if case.status == CaseStatus.CLOSED:
            raise HTTPException(status_code=400, detail="Case already closed")

        case.status = CaseStatus.CLOSED
        db.commit()
        db.refresh(case)
        return case

    # -----------------------------------------------------
    # SUPPORT METRICS
    # -----------------------------------------------------
    @staticmethod
    def get_support_metrics(db: Session) -> SupportMetrics:
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)

        total_cases = db.execute(
            select(func.count(SupportCase.id))
        ).scalar() or 0

        open_cases = db.execute(
            select(func.count(SupportCase.id)).where(SupportCase.status == CaseStatus.OPEN)
        ).scalar() or 0

        closed_cases = db.execute(
            select(func.count(SupportCase.id)).where(SupportCase.status == CaseStatus.CLOSED)
        ).scalar() or 0

        in_progress_cases = db.execute(
            select(func.count(SupportCase.id)).where(SupportCase.status == CaseStatus.IN_PROGRESS)
        ).scalar() or 0

        cases_last_7_days = db.execute(
            select(func.count(SupportCase.id)).where(SupportCase.created_at >= seven_days_ago)
        ).scalar() or 0

        # Compute average response time (hours) from case creation to first non-owner message
        cases = db.execute(
            select(SupportCase.id, SupportCase.user_id, SupportCase.created_at)
        ).all()

        total_hours = 0.0
        replied_count = 0

        for case_id, user_id, created_at in cases:
            first_reply_ts = db.execute(
                select(CaseMessage.created_at)
                .where(
                    CaseMessage.case_id == case_id,
                    CaseMessage.sender_id != user_id,
                )
                .order_by(CaseMessage.created_at.asc())
                .limit(1)
            ).scalar()

            if first_reply_ts is not None and created_at is not None:
                delta = first_reply_ts - created_at
                hours = delta.total_seconds() / 3600.0
                if hours >= 0:
                    total_hours += hours
                    replied_count += 1

        avg_response_time_hours = round(total_hours / replied_count, 2) if replied_count else 0.0

        metrics = SupportMetrics(
            total_cases=total_cases,
            open_cases=open_cases,
            closed_cases=closed_cases,
            in_progress_cases=in_progress_cases,
            cases_last_7_days=cases_last_7_days,
            avg_response_time_hours=avg_response_time_hours,
        )

        return metrics
