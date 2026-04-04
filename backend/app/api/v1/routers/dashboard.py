from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from fastapi import status as http_status
from sqlalchemy import select, func, extract
from datetime import datetime, timezone, timedelta

from app.db.database import async_session
from app.api.v1.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.product import Product
from decimal import Decimal

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    total_orders: int
    total_users: int
    total_products: int
    total_revenue: Decimal


class ChartData(BaseModel):
    orders_by_status: dict[str, int]
    orders_by_day: list[dict]
    revenue_by_day: list[dict]


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    orders_result = await db.execute(select(func.count()).select_from(Order))
    total_orders = orders_result.scalar() or 0

    users_result = await db.execute(
        select(func.count()).select_from(User).where(User.is_superuser == False)
    )
    total_users = users_result.scalar() or 0

    products_result = await db.execute(select(func.count()).select_from(Product))
    total_products = products_result.scalar() or 0

    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == PaymentStatus.COMPLETED)
    )
    total_revenue = revenue_result.scalar() or Decimal(0)

    return DashboardStats(
        total_orders=total_orders,
        total_users=total_users,
        total_products=total_products,
        total_revenue=total_revenue,
    )


@router.get("/charts", response_model=ChartData)
async def get_chart_data(
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    today = datetime.now(timezone.utc).date()

    # Orders by status
    status_result = await db.execute(
        select(Order.status, func.count().label("count"))
        .group_by(Order.status)
    )
    orders_by_status = {
        str(r.status.value): r.count for r in status_result.all()
    }

    # Orders by day (last 7 days)
    day_result = await db.execute(
        select(
            func.date(Order.order_date).label("day"),
            func.count().label("count"),
        )
        .where(Order.order_date >= today - timedelta(days=6))
        .group_by("day")
        .order_by("day")
    )
    day_rows = {str(r.day): r.count for r in day_result.all()}
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    orders_by_day = []
    for i in range(7):
        d = today - timedelta(days=6 - i)
        orders_by_day.append({
            "day": days[d.weekday()],
            "count": day_rows.get(str(d), 0),
        })

    # Revenue per day (last 14 days)
    day_revenue_result = await db.execute(
        select(
            func.date(Payment.paid_at).label("day"),
            func.sum(Payment.amount).label("total"),
        )
        .where(Payment.status == PaymentStatus.COMPLETED)
        .where(Payment.paid_at != None)
        .where(func.date(Payment.paid_at) >= today - timedelta(days=13))
        .group_by("day")
        .order_by("day")
    )
    day_revenue_rows = {
        str(r.day): float(r.total or 0) for r in day_revenue_result.all()
    }
    revenue_by_day = []
    for i in range(14):
        d = today - timedelta(days=13 - i)
        revenue_by_day.append({
            "day": d.strftime("%b %d"),
            "total": day_revenue_rows.get(str(d), 0),
        })

    return ChartData(
        orders_by_status=orders_by_status,
        orders_by_day=orders_by_day,
        revenue_by_day=revenue_by_day,
    )