# app/utils/common.py

from datetime import datetime, timezone
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.orm import Session


def generate_unique_slug(session: Session, model, name: str) -> str:
    """Generate a unique slug for any SQLAlchemy model."""
    base_slug = slugify(name)
    slug = base_slug
    counter = 1

    while session.execute(
        select(model).where(model.slug == slug)
    ).scalar_one_or_none():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def utcnow() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
