# app/api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, SQLModel

from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password, hash_password
from app.db import get_session
from app.models import User, Role, UserCreate
from app.schemas.user import ClientCreateSchema

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: ClientCreateSchema, session: Session = Depends(get_session)):
    """Public user registration endpoint."""

    # Check if email exists
    existing_user = session.exec(select(User).where(User.email == payload.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Assign default role
    user_role = session.exec(select(Role).where(Role.name == "client")).first()
    if not user_role:
        raise HTTPException(status_code=500, detail="User role not initialized")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_verified=False,
        is_active=True,
    )

    # Attach role
    user.roles.append(user_role)

    # Save
    session.add(user)
    session.commit()
    session.refresh(user)

    return {"message": "User registered successfully", "email": user.email}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Login with email and password, returns JWT."""
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")

    role_names = [r.name for r in user.roles]
    if not any(role in role_names for role in ["client", "admin", "staff"]):
        raise HTTPException(status_code=403, detail="This portal is for customers only")

    access_token = create_access_token({"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_verified": user.is_verified,
            "roles": role_names
        }
    }


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": [r.name for r in current_user.roles],
        "is_verified": current_user.is_verified,
    }
