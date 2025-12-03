# app/api/v1/endpoints/admin/auth.py

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.models.user import User
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login")
def admin_login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_session)
):
    user = AuthService.login_user(db, form_data.username, form_data.password)
    # AuthService.ensure_admin_or_staff(user)
    return AuthService.build_login_response(user)


@router.get("/me")
def admin_me(current_user: User = Depends(get_current_user)):
    AuthService.ensure_admin_or_staff(current_user)
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": [r.name for r in current_user.roles],
        "is_verified": current_user.is_verified,
        "is_active": current_user.is_active,
    }
