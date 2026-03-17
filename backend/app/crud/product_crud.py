from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import Optional

from app.models.product import Product, Category, ProductImage


class CategoryCRUD:

    async def create(self, db: AsyncSession, data: dict) -> Category:
        category = Category(**data)
        db.add(category)
        await db.flush()
        return category

    async def get_by_id(self, db: AsyncSession, category_id: UUID) -> Optional[Category]:
        result = await db.execute(
            select(Category).where(Category.id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Category]:
        result = await db.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession) -> list[Category]:
        result = await db.execute(select(Category).order_by(Category.name))
        return result.scalars().all()

    async def update(self, db: AsyncSession, category: Category, data: dict) -> Category:
        for field, value in data.items():
            setattr(category, field, value)
        await db.flush()
        return category

    async def delete(self, db: AsyncSession, category: Category) -> None:
        await db.delete(category)
        await db.flush()


class ProductCRUD:

    def _base_query(self):
        return (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
        )

    async def create(self, db: AsyncSession, data: dict) -> Product:
        product = Product(**data)
        db.add(product)
        await db.flush()
        return product

    async def get_by_id(self, db: AsyncSession, product_id: UUID) -> Optional[Product]:
        result = await db.execute(
            self._base_query().where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[UUID] = None,
        requires_prescription: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Product], int]:
        query = self._base_query()
        count_query = select(func.count()).select_from(Product)

        if category_id:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)
        if requires_prescription is not None:
            query = query.where(Product.requires_prescription == requires_prescription)
            count_query = count_query.where(Product.requires_prescription == requires_prescription)
        if search:
            query = query.where(Product.name.ilike(f"%{search}%"))
            count_query = count_query.where(Product.name.ilike(f"%{search}%"))

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        query = query.offset(skip).limit(limit).order_by(Product.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all(), total

    async def update(self, db: AsyncSession, product: Product, data: dict) -> Product:
        for field, value in data.items():
            setattr(product, field, value)
        await db.flush()
        return product

    async def delete(self, db: AsyncSession, product: Product) -> None:
        await db.delete(product)
        await db.flush()

    # ── Images ────────────────────────────────────────────────────────────────

    async def add_image(self, db: AsyncSession, data: dict) -> ProductImage:
        # If this is set as primary, unset all others for this product
        if data.get("is_primary"):
            await db.execute(
                select(ProductImage)
                .where(ProductImage.product_id == data["product_id"])
            )
            result = await db.execute(
                select(ProductImage).where(
                    ProductImage.product_id == data["product_id"],
                    ProductImage.is_primary == True,
                )
            )
            existing_primary = result.scalars().all()
            for img in existing_primary:
                img.is_primary = False

        image = ProductImage(**data)
        db.add(image)
        await db.flush()
        return image

    async def delete_image(self, db: AsyncSession, image: ProductImage) -> None:
        await db.delete(image)
        await db.flush()

    async def get_image_by_id(
        self, db: AsyncSession, image_id: UUID
    ) -> Optional[ProductImage]:
        result = await db.execute(
            select(ProductImage).where(ProductImage.id == image_id)
        )
        return result.scalar_one_or_none()


category_crud = CategoryCRUD()
product_crud = ProductCRUD()