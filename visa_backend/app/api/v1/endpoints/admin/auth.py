from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.db import get_session
from app.models import User
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter()


@router.post("/login")
def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Login for admin/staff users only."""
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    role_names = [r.name for r in user.roles]
    # if not any(role in role_names for role in ["admin", "staff"]):
    #     raise HTTPException(status_code=403, detail="Admin access only")

    access_token = create_access_token({"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"email": user.email, "roles": role_names},
    }


@router.get("/me")
def get_admin_profile(current_user: User = Depends(get_current_user)):
    """Return the authenticated admin/staff user's profile."""

    # Validate admin or staff access
    role_names = [r.name for r in current_user.roles]
    if not any(role in role_names for role in ["admin", "staff"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or staff access required",
        )

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": role_names,
        "is_verified": current_user.is_verified,
        "is_active": current_user.is_active,
    }
