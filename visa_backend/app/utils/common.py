# app/utils/common.py

from datetime import datetime, timezone
from slugify import slugify
from sqlmodel import Session, select


def generate_unique_slug(session: Session, model, name: str) -> str:
    base_slug = slugify(name)
    slug = base_slug
    counter = 1
    while session.exec(select(model).where(model.slug == slug)).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug


def utcnow() -> datetime:
    """Return timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)
