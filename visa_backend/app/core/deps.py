# app/core/deps.py
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/admin/auth/login")


def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_session),
) -> User:
    """Extract current user from JWT token."""
    payload = decode_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = payload["sub"]

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


def get_current_user_optional(
        user: Optional[User] = Depends(get_current_user)
):
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the user has the 'admin' role."""
    role_names = [role.name for role in current_user.roles]

    if "admin" not in role_names:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the user has 'admin' or 'staff' role."""
    role_names = [role.name for role in current_user.roles]

    if not any(r in role_names for r in ["admin", "staff"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff or Admin access required",
        )

    return current_user
