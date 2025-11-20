from sqlmodel import SQLModel

# Import all models so SQLModel knows about them when creating tables
# Import the model package to register all models (app/models/__init__.py imports them)
import app.models  # noqa: F401

# This ensures all models are registered with SQLModel.metadata
__all__ = ["SQLModel"]
