from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db import get_session
from app.models import (
    SupportCase,
    SupportCaseCreate,
    SupportCaseRead,
    CaseMessage,
    CaseMessageCreate,
    CaseMessageRead,
    User,
)
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/", response_model=SupportCaseRead, status_code=status.HTTP_201_CREATED)
def create_case(
        case_data: SupportCaseCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Customer creates a new support case for an order"""
    new_case = SupportCase(
        user_id=current_user.id,
        order_id=case_data.order_id,
        subject=case_data.subject,
        description=case_data.description,
    )
    session.add(new_case)
    session.commit()
    session.refresh(new_case)
    return new_case


@router.get("/", response_model=list[SupportCaseRead])
def list_my_cases(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """List all cases created by the current user"""
    cases = session.exec(
        select(SupportCase).where(SupportCase.user_id == current_user.id)
    ).all()
    return cases


@router.post("/{case_id}/message", response_model=CaseMessageRead)
def send_message_to_case(
        case_id: int,
        message_data: CaseMessageCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Customer sends a message to a support case"""
    case = session.get(SupportCase, case_id)
    if not case or case.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Case not found")

    msg = CaseMessage(case_id=case.id, sender_id=current_user.id, message=message_data.message)
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg


@router.get("/{case_id}/messages", response_model=list[CaseMessageRead])
def get_case_messages(
        case_id: int,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Get all messages for a case"""
    case = session.get(SupportCase, case_id)
    if not case or case.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Case not found")

    messages = session.exec(
        select(CaseMessage).where(CaseMessage.case_id == case.id).order_by(CaseMessage.created_at)
    ).all()
    return messages
