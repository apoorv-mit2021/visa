# app/api/v1/endpoints/admin/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from datetime import datetime, timedelta
from typing import List

from app.db import get_session
from app.models import Order, User, Product, Role, ProductVariant
from app.core.deps import get_current_user, require_staff

router = APIRouter()

# METRICS
@router.get("/metrics/")
def get_dashboard_metrics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Return high-level admin dashboard metrics"""
    require_staff(current_user)

    # ✅ Total orders
    total_orders = session.exec(select(func.count(Order.id))).one() or 0

    # ✅ Total customers (joined with Role)
    total_customers = (
            session.exec(
                select(func.count(User.id))
                .join(User.roles)
                .where(Role.name == "client")
            ).one()
            or 0
    )

    return {
        "total_orders": total_orders,
        "total_customers": total_customers,
    }


# ---------------------------------------------------
# 2️⃣  MONTHLY SALES BAR CHART
# ---------------------------------------------------
@router.get("/sales/monthly")
def get_monthly_sales_chart(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Return total monthly sales (for bar chart)"""
    require_admin(current_user)

    current_year = datetime.utcnow().year
    results = session.exec(
        select(
            func.strftime("%m", Order.created_at).label("month"),
            func.sum(Order.total_amount).label("sales"),
        )
        .where(func.strftime("%Y", Order.created_at) == str(current_year))
        .group_by("month")
        .order_by("month")
    ).all()

    monthly_sales = {str(i).zfill(2): 0 for i in range(1, 13)}  # Default months
    for month, sales in results:
        monthly_sales[month] = round(sales or 0, 2)

    labels = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    values = [monthly_sales[str(i).zfill(2)] for i in range(1, 13)]

    return {"labels": labels, "values": values}


# ---------------------------------------------------
# 3️⃣  MONTHLY TARGET DATA (RADIAL CHART)
# ---------------------------------------------------
@router.get("/target/monthly")
def get_monthly_target(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Return monthly revenue vs target data for radial chart"""
    require_admin(current_user)

    now = datetime.utcnow()
    start_month = datetime(now.year, now.month, 1)
    total_sales = (
            session.exec(
                select(func.sum(Order.total_amount)).where(Order.created_at >= start_month)
            ).one()
            or 0.0
    )

    # Example fixed target
    target = 20000
    percentage = round((total_sales / target) * 100, 2) if target > 0 else 0

    return {
        "target": target,
        "current_revenue": round(total_sales, 2),
        "percentage": percentage,
        "today_revenue": round(total_sales * 0.05, 2),  # Mock example
        "growth_percent": 10.0,  # Example growth value
    }


# ---------------------------------------------------
# 4️⃣  RECENT ORDERS (LAST 5)
# ---------------------------------------------------
@router.get("/orders/recent")
def get_recent_orders(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Return last 5 orders"""
    require_admin(current_user)

    orders = session.exec(
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
    ).all()

    return orders


# ---------------------------------------------------
# 5️⃣  LOW STOCK ITEMS (LOWEST 5)
# ---------------------------------------------------
@router.get("/products/low-stock")
def get_low_stock_products(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """Return top 5 low-stock products based on variant stock."""
    require_admin(current_user)

    # Get variants with low stock
    low_stock_variants = session.exec(
        select(ProductVariant)
        .where(ProductVariant.stock_quantity <= 10)
        .order_by(ProductVariant.stock_quantity.asc())
        .limit(5)
    ).all()

    # Build simple response mapping back to product info
    results = []
    for variant in low_stock_variants:
        product = variant.product
        results.append({
            "product_id": product.id,
            "product_name": product.name,
            "variant_id": variant.id,
            "variant_name": variant.name,
            "sku": variant.sku,
            "stock_quantity": variant.stock_quantity,
            "category": product.category,
            "is_active": product.is_active,
        })

    return results


# ---------------------------------------------------
# 6️⃣  STATISTICS CHART (SALES VS REVENUE)
# ---------------------------------------------------
@router.get("/statistics")
def get_sales_revenue_statistics(
        session: Session = Depends(get_session),
        current_user: User = Depends(get_current_user),
):
    """
    Return monthly sales & revenue data for line chart
    (used in StatisticsChart)
    """
    require_admin(current_user)

    current_year = datetime.utcnow().year
    results = session.exec(
        select(
            func.strftime("%m", Order.created_at).label("month"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("sales_count"),
        )
        .where(func.strftime("%Y", Order.created_at) == str(current_year))
        .group_by("month")
        .order_by("month")
    ).all()

    monthly_data = {str(i).zfill(2): {"sales": 0, "revenue": 0} for i in range(1, 13)}
    for month, revenue, sales_count in results:
        monthly_data[month] = {"sales": sales_count or 0, "revenue": round(revenue or 0, 2)}

    labels = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]
    sales = [monthly_data[str(i).zfill(2)]["sales"] for i in range(1, 13)]
    revenue = [monthly_data[str(i).zfill(2)]["revenue"] for i in range(1, 13)]

    return {"labels": labels, "sales": sales, "revenue": revenue}
