# app/db/session.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# ✅ Import Base so SQLAlchemy registers all models before table creation
from app.models.base import Base  # noqa

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DB_ECHO", "false").lower() == "true",
    pool_pre_ping=True,
    future=True,
)

# SessionLocal factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)


def create_db_and_tables() -> None:
    """Create database tables using SQLAlchemy metadata."""
    Base.metadata.create_all(bind=engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency for DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
