# app/core/deps.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.core.security import decode_access_token
from app.db import get_session
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User:
    """Extract current user from JWT token."""
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = session.exec(select(User).where(User.email == payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the user has the admin role."""
    role_names = [r.name for r in current_user.roles]

    if "admin" not in role_names:
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the user has the staff or admin role."""
    role_names = [r.name for r in current_user.roles]

    if not any(r in role_names for r in ["admin", "staff"]):
        raise HTTPException(status_code=403, detail="Staff or Admin access required")

    return current_user
