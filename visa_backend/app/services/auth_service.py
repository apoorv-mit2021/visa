# app/services/auth_service.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, hash_password, create_access_token
from app.models.user import User, Role
from app.schemas.user import ClientCreateSchema


class AuthService:

    # ------------------------------
    # USER LOOKUP
    # ------------------------------
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    # ------------------------------
    # LOGIN (common logic)
    # ------------------------------
    @staticmethod
    def login_user(db: Session, email: str, password: str) -> User:
        user = AuthService.get_user_by_email(db, email)

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        if not user.is_active:
            raise HTTPException(status_code=403, detail="User account is inactive")

        return user

    # ------------------------------
    # ADMIN CHECK
    # ------------------------------
    @staticmethod
    def ensure_admin_or_staff(user: User):
        roles = [r.name for r in user.roles]
        if not any(r in roles for r in ["admin", "staff"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or staff access required"
            )

    # ------------------------------
    # CLIENT CHECK
    # ------------------------------
    @staticmethod
    def ensure_client(user: User):
        roles = [r.name for r in user.roles]
        if not any(r in roles for r in ["client", "admin", "staff"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This portal is for customers only"
            )

    # ------------------------------
    # REGISTER CLIENT
    # ------------------------------
    @staticmethod
    def register_client(db: Session, payload: ClientCreateSchema) -> User:

        # check existing email
        if AuthService.get_user_by_email(db, payload.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        # client role
        client_role = db.query(Role).filter(Role.name == "client").first()
        if not client_role:
            raise HTTPException(status_code=500, detail="Client role missing")

        new_user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            is_verified=False,
            is_active=True,
        )

        new_user.roles.append(client_role)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    # ------------------------------
    # GENERATE JWT RESPONSE
    # ------------------------------
    @staticmethod
    def build_login_response(user: User) -> dict:
        token = create_access_token({"sub": user.email})
        return {
            "access_token": token,
            "token_type": "Bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "roles": [r.name for r in user.roles],
                "is_verified": user.is_verified,
            }
        }

    @staticmethod
    def build_client_login_response(user: User) -> dict:
        token = create_access_token({"sub": user.email})

        # ---------------------------------------------------
        # Split full_name into firstName / lastName
        # ---------------------------------------------------
        first_name = ""
        last_name = ""
        if user.full_name:
            parts = user.full_name.strip().split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        # ---------------------------------------------------
        # Prepare default empty address structure
        # (matches frontend interface exactly)
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
        # Map backend Address → frontend shape
        # ---------------------------------------------------
        for addr in user.addresses:
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
        # Final response payload
        # ---------------------------------------------------
        return {
            "access_token": token,
            "token_type": "Bearer",
            "user": {
                "id": user.id,
                "email": user.email,

                # frontend fields
                "firstName": first_name,
                "lastName": last_name,
                "phone": "",  # backend doesn't have "phone" yet

                "shippingAddress": shipping_address,
                "billingAddress": billing_address,
            },
        }


