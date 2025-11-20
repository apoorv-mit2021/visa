# app/utils/currency.py

from fastapi import Header
from app.core.config import ALLOWED_CURRENCIES, DEFAULT_CURRENCY


def get_currency_from_request(x_currency: str = Header(None)) -> str:
    """
    Resolves requested currency from header (X-Currency)
    or falls back to DEFAULT_CURRENCY.
    """
    if x_currency and x_currency.upper() in ALLOWED_CURRENCIES:
        return x_currency.upper()
    return DEFAULT_CURRENCY
