# app/db/session.py

from sqlmodel import create_engine, Session, SQLModel
from typing import Generator
import os

# ✅ Import base to register models before table creation
from app.db import base  # noqa

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
)


def create_db_and_tables() -> None:
    """Create database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session
