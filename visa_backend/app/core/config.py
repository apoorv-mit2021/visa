import os
from pydantic_settings import BaseSettings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")


class Settings(BaseSettings):
    SECRET_KEY: str
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    ALLOWED_CURRENCIES: set[str] = {"USD", "EUR", "CAD"}
    DEFAULT_CURRENCY: str = "CAD"

    class Config:
        env_file = ENV_PATH
        env_file_encoding = "utf-8"


settings = Settings()
