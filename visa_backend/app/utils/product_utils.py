from typing import Optional


def get_variant_price(variant, currency: str) -> Optional[float]:
    price_obj = next(
        (p for p in variant.prices
         if p.currency == currency and p.is_active),
        None
    )
    return float(price_obj.price) if price_obj else None
