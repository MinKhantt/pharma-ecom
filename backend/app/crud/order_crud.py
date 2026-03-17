from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product


class OrderCRUD:

    def _base_query(self):
        return (
            select(Order)
            .options(
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.images),
                selectinload(Order.items)
                .selectinload(OrderItem.product)
                .selectinload(Product.category),
                selectinload(Order.payment),
            )
        )

    async def create(self, db: AsyncSession, data: dict) -> Order:
        order = Order(**data)
        db.add(order)
        await db.flush()
        return order

    async def add_items(self, db: AsyncSession, items: list[dict]) -> None:
        for item_data in items:
            item = OrderItem(**item_data)
            db.add(item)
        await db.flush()

    async def get_by_id(self, db: AsyncSession, order_id: UUID) -> Optional[Order]:
        result = await db.execute(
            self._base_query().where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        status: Optional[OrderStatus] = None,
    ) -> tuple[list[Order], int]:
        query = self._base_query().where(Order.user_id == user_id)
        count_query = select(func.count()).select_from(Order).where(Order.user_id == user_id)

        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(skip).limit(limit).order_by(Order.order_date.desc())
        result = await db.execute(query)
        return result.scalars().all(), total

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        status: Optional[OrderStatus] = None,
    ) -> tuple[list[Order], int]:
        query = self._base_query()
        count_query = select(func.count()).select_from(Order)

        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(skip).limit(limit).order_by(Order.order_date.desc())
        result = await db.execute(query)
        return result.scalars().all(), total

    async def update(self, db: AsyncSession, order: Order, data: dict) -> Order:
        for field, value in data.items():
            setattr(order, field, value)
        await db.flush()
        return order


order_crud = OrderCRUD()