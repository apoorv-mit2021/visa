# app/api/v1/endpoints/store/support_case.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.models.user import User
from app.schemas.case import (
    SupportCaseCreate,
    SupportCaseRead,
    CaseMessageCreate,
    CaseMessageRead,
)
from app.services.case_service import SupportCaseService

router = APIRouter()


# -----------------------------------------------------
# CREATE SUPPORT CASE
# -----------------------------------------------------
@router.post("/", response_model=SupportCaseRead)
def create_case(
        payload: SupportCaseCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    case = SupportCaseService.create_case(db, current_user.id, payload)
    return SupportCaseRead.model_validate(case)


# -----------------------------------------------------
# LIST USER CASES
# -----------------------------------------------------
@router.get("/", response_model=List[SupportCaseRead])
def list_user_cases(
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    cases = SupportCaseService.list_user_cases(db, current_user.id)
    return [SupportCaseRead.model_validate(c) for c in cases]


# -----------------------------------------------------
# GET CASE (OWNER ONLY)
# -----------------------------------------------------
@router.get("/{case_id}", response_model=SupportCaseRead)
def get_user_case(
        case_id: int,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    case = SupportCaseService.get_case(db, case_id)

    if case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return SupportCaseRead.model_validate(case)


# -----------------------------------------------------
# USER REPLY TO CASE
# -----------------------------------------------------
@router.post("/{case_id}/message", response_model=CaseMessageRead)
def user_add_message(
        case_id: int,
        payload: CaseMessageCreate,
        db: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    case = SupportCaseService.get_case(db, case_id)

    if case.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    message = SupportCaseService.add_message(
        db=db,
        case_id=case_id,
        sender_id=current_user.id,
        data=payload,
    )

    return CaseMessageRead.model_validate(message)
