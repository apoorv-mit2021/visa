#!/usr/bin/env python3
"""
Seed sample support cases with messages.
Safe to run multiple times — avoids duplicates.
"""

import os
import sys
from datetime import timedelta
import random

from sqlalchemy import select
from sqlmodel import Session

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine
from app.models.user import User, Role
from app.models.order import Order
from app.models.case import SupportCase, CaseMessage, CaseStatus
from app.utils.common import utcnow

# ---------------------------------------------------------
# SAMPLE CASE DATA
# ---------------------------------------------------------
SAMPLE_CASES = [
    {
        "subject": "Where is my order?",
        "description": "I placed my order 4 days ago and still no update.",
        "status": CaseStatus.OPEN,
    },
    {
        "subject": "Issue with size",
        "description": "The ring size is incorrect. Need exchange ASAP.",
        "status": CaseStatus.OPEN,
    },
    {
        "subject": "Refund request",
        "description": "I want to return the necklace and get a refund.",
        "status": CaseStatus.CLOSED,
    },
    {
        "subject": "Damaged product received",
        "description": "The bracelet arrived with a broken clasp.",
        "status": CaseStatus.OPEN,
    },
]

SAMPLE_MESSAGES = [
    "Thank you for contacting support.",
    "We are looking into this issue.",
    "Can you please provide additional images?",
    "We have escalated your request to our quality team.",
    "Your case is being processed.",
]


# ---------------------------------------------------------
# HELPER: GET RANDOM STAFF USER
# ---------------------------------------------------------
def get_random_staff(db: Session) -> User:
    return db.exec(
        select(User)
        .join(User.roles)
        .where(Role.name.in_(["staff", "admin"]))
        .order_by(User.created_at.desc())
    ).scalars().first()


# ---------------------------------------------------------
# HELPER: GET RANDOM CUSTOMER
# ---------------------------------------------------------
def get_random_customer(db: Session) -> User:
    return db.exec(
        select(User)
        .join(User.roles)
        .where(Role.name == "client")
        .order_by(User.created_at.desc())
    ).scalars().first()


# ---------------------------------------------------------
# SEED SUPPORT CASES
# ---------------------------------------------------------
def seed_cases():
    with Session(engine) as db:
        print("🚀 Seeding support cases...")

        staff_user = get_random_staff(db)
        client_user = get_random_customer(db)

        if not staff_user or not client_user:
            print("⚠️ Need at least 1 staff and 1 client user to seed cases!")
            return

        # Fetch an order to relate with cases if available
        order = db.exec(select(Order).order_by(Order.created_at.desc())).scalars().first()

        for case_data in SAMPLE_CASES:
            # Avoid duplicate case subjects
            existing = db.exec(
                select(SupportCase).where(SupportCase.subject == case_data["subject"])
            ).scalars().first()
            if existing:
                print(f"ℹ️ Skipping existing case: {existing.subject}")
                continue

            # Create case
            case = SupportCase(
                user_id=client_user.id,
                order_id=order.id if order else None,
                assigned_to_id=staff_user.id if case_data["status"] != CaseStatus.CLOSED else None,
                subject=case_data["subject"],
                description=case_data["description"],
                status=case_data["status"],
            )

            db.add(case)
            db.flush()  # ensures case.id exists

            # Add messages
            num_messages = random.randint(1, 3)
            for _ in range(num_messages):
                msg = CaseMessage(
                    case_id=case.id,
                    sender_id=random.choice([client_user.id, staff_user.id]),
                    message=random.choice(SAMPLE_MESSAGES),
                    created_at=utcnow() - timedelta(minutes=random.randint(1, 300)),
                )
                db.add(msg)

            db.commit()
            print(f"✅ Created case: {case.subject}")

        print("🎉 Support case seeding complete!")


if __name__ == "__main__":
    seed_cases()
