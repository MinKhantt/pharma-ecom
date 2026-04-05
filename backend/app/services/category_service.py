from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from uuid import UUID

from app.crud.category_crud import category_crud
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.models.category import Category

class CategoryService:

    async def create(self, db: AsyncSession, data: CategoryCreate) -> Category:
        existing = await category_crud.get_by_name(db, data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category name already exists",
            )
        category = await category_crud.create(db, obj_in=data.model_dump())
        await db.commit()
        await db.refresh(category)
        return category

    async def get_all(
        self, 
        db: AsyncSession,
    ) -> list[Category]:
        return await category_crud.get_all_ordered(db)

    async def get_by_id(self, db: AsyncSession, category_id: UUID) -> Category:
        category = await category_crud.get(db, category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )
        return category

    async def update(
        self, db: AsyncSession, category_id: UUID, data: CategoryUpdate
    ) -> Category:
        category = await category_crud.get(db, category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )
        if data.name and data.name != category.name:
            existing = await category_crud.get_by_name(db, data.name)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Category name already exists",
                )
        await category_crud.update(db, db_obj=category, obj_in=data.model_dump(exclude_none=True))
        await db.commit()
        await db.refresh(category)
        return category

    async def delete(self, db: AsyncSession, category_id: UUID) -> None:
        category = await category_crud.get(db, category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )
        await category_crud.delete(db, db_obj=category)
        await db.commit()

category_service = CategoryService()
