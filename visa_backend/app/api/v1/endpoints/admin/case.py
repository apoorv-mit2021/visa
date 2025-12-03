# app/api/v1/endpoints/admin/support_case.py

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_session, require_staff
from app.models.user import User
from app.schemas.case import (
    SupportCaseRead,
    SupportCaseUpdate,
    CaseMessageCreate,
    CaseMessageRead,
    SupportMetrics,
)
from app.services.case_service import SupportCaseService

router = APIRouter()


# -----------------------------------------------------
# LIST ALL CASES
# -----------------------------------------------------
@router.get("/", response_model=List[SupportCaseRead])
def list_cases(
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1),
):
    cases = SupportCaseService.list_cases(
        db=db,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )
    return [SupportCaseRead.model_validate(c) for c in cases]


# -----------------------------------------------------
# SUPPORT METRICS
# -----------------------------------------------------
@router.get("/metrics/", response_model=SupportMetrics)
def get_metrics(
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    metrics = SupportCaseService.get_support_metrics(db)
    return metrics


# -----------------------------------------------------
# GET SINGLE CASE
# -----------------------------------------------------
@router.get("/{case_id}", response_model=SupportCaseRead)
def get_case(
        case_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    case = SupportCaseService.get_case(db, case_id)
    return SupportCaseRead.model_validate(case)


# -----------------------------------------------------
# UPDATE CASE (ADMIN)
# -----------------------------------------------------
@router.put("/{case_id}", response_model=SupportCaseRead)
def update_case(
        case_id: int,
        payload: SupportCaseUpdate,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    updated = SupportCaseService.update_case(db, case_id, payload)
    return SupportCaseRead.model_validate(updated)


# -----------------------------------------------------
# CLOSE CASE
# -----------------------------------------------------
@router.post("/{case_id}/close", response_model=SupportCaseRead)
def close_case(
        case_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    closed = SupportCaseService.close_case(db, case_id)
    return SupportCaseRead.model_validate(closed)


# -----------------------------------------------------
# ADMIN REPLY TO CASE
# -----------------------------------------------------
@router.post("/{case_id}/message", response_model=CaseMessageRead)
def admin_add_message(
        case_id: int,
        payload: CaseMessageCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(require_staff),
):
    message = SupportCaseService.add_message(
        db=db,
        case_id=case_id,
        sender_id=current_user.id,
        data=payload,
    )
    return CaseMessageRead.model_validate(message)
