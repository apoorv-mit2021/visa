# app/api/v1/endpoints/auth.py

# app/api/v1/endpoints/store/auth.py

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_session, get_current_user
from app.schemas.user import ClientCreateSchema
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()


@router.post("/register", status_code=201)
def register_user(payload: ClientCreateSchema, db: Session = Depends(get_session)):
    user = AuthService.register_client(db, payload)
    return {"message": "User registered successfully", "email": user.email}


@router.post("/login")
def client_login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_session)
):
    user = AuthService.login_user(db, form_data.username, form_data.password)
    AuthService.ensure_client(user)
    return AuthService.build_client_login_response(user)


@router.get("/me")
def client_me(current_user: User = Depends(get_current_user)):
    AuthService.ensure_client(current_user)

    # ---------------------------------------------------
    # Split full_name into first and last names
    # ---------------------------------------------------
    first_name = ""
    last_name = ""
    if current_user.full_name:
        parts = current_user.full_name.strip().split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    # ---------------------------------------------------
    # Default empty address structure
    # ---------------------------------------------------
    empty_address = {
        "name": "",
        "street": "",
        "apartment": "",
        "city": "",
        "state": "",
        "zip": "",
        "country": "",
    }

    shipping_address = empty_address.copy()
    billing_address = empty_address.copy()

    # ---------------------------------------------------
    # Map the user's saved addresses
    # ---------------------------------------------------
    for addr in current_user.addresses:
        mapped = {
            "name": addr.full_name,
            "street": addr.street,
            "apartment": addr.apartment,
            "city": addr.city,
            "state": addr.state,
            "zip": addr.zip,
            "country": addr.country,
        }

        if addr.type == "shipping":
            shipping_address = mapped
        elif addr.type == "billing":
            billing_address = mapped

    # ---------------------------------------------------
    # Return the exact UI interface structure
    # ---------------------------------------------------
    return {
        "id": current_user.id,
        "email": current_user.email,
        "firstName": first_name,
        "lastName": last_name,
        "phone": "",  # backend does not have phone column yet

        "shippingAddress": shipping_address,
        "billingAddress": billing_address,
    }
