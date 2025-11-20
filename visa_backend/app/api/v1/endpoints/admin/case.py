from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from datetime import datetime, timedelta

from app.db import get_session
from app.models import (
    SupportCase,
    SupportCaseUpdate,
    SupportCaseRead,
    CaseMessage,
    CaseMessageCreate,
    CaseMessageRead,
    User,
)
from app.core.deps import get_current_user, require_admin

router = APIRouter()


# ---------------------------------------------------
# 📋 LIST ALL SUPPORT CASES
# ---------------------------------------------------
@router.get("/", response_model=list[SupportCaseRead])
def list_all_cases(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Admin/staff view of all support cases"""
    role_names = [r.name for r in current_user.roles]
    if not any(r in role_names for r in ["admin", "staff"]):
        raise HTTPException(status_code=403, detail="Admin/staff access only")

    cases = session.exec(select(SupportCase).order_by(SupportCase.created_at.desc())).all()
    return cases


# ---------------------------------------------------
# ✏️ UPDATE SUPPORT CASE
# ---------------------------------------------------
@router.put("/{case_id}", response_model=SupportCaseRead)
def update_case(
        case_id: int,
        update_data: SupportCaseUpdate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Admin can assign or change case status"""
    require_admin(current_user)

    case = session.get(SupportCase, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(case, key, value)

    session.add(case)
    session.commit()
    session.refresh(case)
    return case


# ---------------------------------------------------
# 💬 ADD STAFF MESSAGE TO CASE
# ---------------------------------------------------
@router.post("/{case_id}/message", response_model=CaseMessageRead)
def staff_add_message(
        case_id: int,
        message_data: CaseMessageCreate,
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Staff or admin sends message in a case"""
    role_names = [r.name for r in current_user.roles]
    if not any(r in role_names for r in ["admin", "staff"]):
        raise HTTPException(status_code=403, detail="Admin/staff access only")

    case = session.get(SupportCase, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    msg = CaseMessage(
        case_id=case.id,
        sender_id=current_user.id,
        message=message_data.message,
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg


# ---------------------------------------------------
# 📊 SUPPORT CASE METRICS
# ---------------------------------------------------
@router.get("/metrics/", tags=["Admin: Support"])
def get_support_case_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    📈 Retrieve key metrics for support cases (admin/staff only)
    - total_cases
    - open_cases
    - closed_cases
    - in_progress_cases
    - avg_response_time_hours
    - cases_last_7_days
    """
    role_names = [r.name for r in current_user.roles]
    if not any(r in role_names for r in ["admin", "staff"]):
        raise HTTPException(status_code=403, detail="Admin/staff access only")

    # Total cases
    total_cases = session.exec(select(func.count(SupportCase.id))).one()

    # Status breakdown
    open_cases = session.exec(
        select(func.count(SupportCase.id)).where(SupportCase.status == "open")
    ).one()
    closed_cases = session.exec(
        select(func.count(SupportCase.id)).where(SupportCase.status == "closed")
    ).one()
    in_progress_cases = session.exec(
        select(func.count(SupportCase.id)).where(SupportCase.status == "in_progress")
    ).one()

    # Cases created in the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    cases_last_7_days = session.exec(
        select(func.count(SupportCase.id)).where(SupportCase.created_at >= seven_days_ago)
    ).one()

    # Average response time (based on first message timestamps)
    avg_response_time = session.exec(
        select(func.avg(func.julianday(CaseMessage.created_at) - func.julianday(SupportCase.created_at)))
        .join(SupportCase, SupportCase.id == CaseMessage.case_id)
    ).one() or 0.0

    avg_response_time_hours = round(avg_response_time * 24, 2)  # convert days → hours

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "in_progress_cases": in_progress_cases,
        "closed_cases": closed_cases,
        "cases_last_7_days": cases_last_7_days,
        "avg_response_time_hours": avg_response_time_hours,
    }
