# app/services/dashboard_service.py

from datetime import datetime
from typing import List

from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.models import SupportCase
from app.models.order import Order
from app.models.user import User, Role
from app.models.catalog import Product


class DashboardService:

    # -----------------------------------------------------
    # 1️⃣ DASHBOARD METRICS
    # -----------------------------------------------------
    @staticmethod
    def get_dashboard_metrics(session: Session):
        total_orders = session.execute(
            select(func.count(Order.id))
        ).scalar() or 0

        total_customers = session.execute(
            select(func.count(User.id))
            .join(User.roles)
            .where(Role.name == "client")
        ).scalar() or 0

        return {
            "total_orders": total_orders,
            "total_customers": total_customers,
        }

    # -----------------------------------------------------
    # 2️⃣ MONTHLY SALES (BAR CHART)
    # -----------------------------------------------------
    @staticmethod
    def get_monthly_sales(session: Session):
        current_year = datetime.utcnow().year

        results = session.execute(
            select(
                func.strftime("%m", Order.created_at).label("month"),
                func.sum(Order.total_amount).label("sales")
            )
            .where(func.strftime("%Y", Order.created_at) == str(current_year))
            .group_by("month")
            .order_by("month")
        ).all()

        monthly_sales = {f"{i:02d}": 0 for i in range(1, 13)}

        for month, sales in results:
            monthly_sales[month] = round(sales or 0, 2)

        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
                  "Aug", "Sep", "Oct", "Nov", "Dec"]
        values = [monthly_sales[f"{i:02d}"] for i in range(1, 13)]

        return {
            "labels": labels,
            "values": values,
        }

    # -----------------------------------------------------
    # 3️⃣ MONTHLY TARGET (RADIAL)
    # -----------------------------------------------------
    @staticmethod
    def get_monthly_target(session: Session):
        now = datetime.utcnow()
        start_month = datetime(now.year, now.month, 1)

        total_sales = session.execute(
            select(func.sum(Order.total_amount))
            .where(Order.created_at >= start_month)
        ).scalar() or 0.0

        target = 20000
        percentage = round((total_sales / target) * 100, 2) if target else 0

        return {
            "target": target,
            "current_revenue": round(total_sales, 2),
            "percentage": percentage,
            "today_revenue": round(total_sales * 0.05, 2),
            "growth_percent": 10.0,
        }

    # -----------------------------------------------------
    # 4️⃣ RECENT ORDERS (LAST 5)
    # -----------------------------------------------------
    @staticmethod
    def get_recent_orders(db: Session):

        return db.query(Order).filter(Order.status == "pending").order_by(Order.id.desc()).limit(5)

    # -----------------------------------------------------
    # 6️⃣ SALES + REVENUE LINE CHART
    # -----------------------------------------------------
    @staticmethod
    def get_statistics(session: Session):
        current_year = datetime.utcnow().year

        rows = session.execute(
            select(
                func.strftime("%m", Order.created_at).label("month"),
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("sales_count"),
            )
            .where(func.strftime("%Y", Order.created_at) == str(current_year))
            .group_by("month")
            .order_by("month")
        ).all()

        monthly = {f"{i:02d}": {"sales": 0, "revenue": 0} for i in range(1, 13)}

        for month, revenue, sales_count in rows:
            monthly[month] = {
                "sales": sales_count or 0,
                "revenue": round(revenue or 0, 2),
            }

        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        sales = [monthly[f"{i:02d}"]["sales"] for i in range(1, 13)]
        revenue = [monthly[f"{i:02d}"]["revenue"] for i in range(1, 13)]

        return {
            "labels": labels,
            "sales": sales,
            "revenue": revenue,
        }

    @staticmethod
    def get_recent_cases(
            db: Session
    ):
        return db.query(SupportCase).filter(SupportCase.status == "open").order_by(SupportCase.id.desc()).limit(5)
