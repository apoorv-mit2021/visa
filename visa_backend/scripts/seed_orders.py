#!/usr/bin/env python3
"""
Seed the database with sample Orders and Order Items.
Safe to run multiple times — if orders already exist, nothing is added.
"""

import os
import sys
import random
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db import engine
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.models.catalog import Product


def utcnow():
    return datetime.now(timezone.utc)


# --------------------------------------------------------
# SAMPLE ADDRESS SNAPSHOT FOR SEEDING
# --------------------------------------------------------
def generate_address_snapshot(user=None):
    name = user.full_name if user else "Guest User"

    return {
        "name": name,
        "street": "123 Sample Street",
        "apartment": "Apt 4B",
        "city": "Test City",
        "state": "Test State",
        "zip": "999999",
        "country": "India",
    }


# --------------------------------------------------------
# SEED ORDERS
# --------------------------------------------------------
def seed_orders():
    with Session(engine) as session:

        # Skip if orders already exist
        existing = session.execute(select(Order)).scalars().all()
        if existing:
            print("ℹ️ Orders already exist, skipping seeding.")
            return

        users = session.execute(select(User)).scalars().all()
        products = session.execute(select(Product)).scalars().all()

        if not users:
            print("❌ No users found! Cannot seed orders.")
            return

        if not products:
            print("❌ No products found! Cannot seed orders.")
            return

        print(f"Found {len(users)} users and {len(products)} products. Creating sample orders...")

        statuses = [
            OrderStatus.PENDING,
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.CANCELLED,
            OrderStatus.RETURNED,
        ]

        num_orders = 10

        for _ in range(num_orders):

            # pick random user  (simulate real order)
            user = random.choice(users)

            # create order
            order = Order(
                user_id=user.id,  # or None for guest
                total_amount=0.0,
                status=random.choice(statuses),
                shipping_address=generate_address_snapshot(user),
                billing_address=generate_address_snapshot(user),
            )

            session.add(order)
            session.flush()  # ensure order.id is available

            total = 0.0
            num_items = random.randint(1, 3)

            for _ in range(num_items):
                product = random.choice(products)

                # pick random size
                if isinstance(product.sizes, dict) and product.sizes:
                    size = random.choice(list(product.sizes.keys()))
                else:
                    size = "default"

                quantity = random.randint(1, 3)
                price = product.price

                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    size=size,
                    quantity=quantity,
                    price=price,
                )

                session.add(order_item)
                total += price * quantity

            # update order amount
            order.total_amount = total

        session.commit()
        print("🎉 Order seeding complete!")


# --------------------------------------------------------
# RUN SCRIPT
# --------------------------------------------------------
if __name__ == "__main__":
    seed_orders()
