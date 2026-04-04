from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, UploadFile, status
from uuid import UUID
from typing import Optional

from app.crud.product_crud import product_crud, category_crud
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    CategoryCreate,
    CategoryUpdate,
)
from app.models.product import Product, Category
from app.core.file_upload import save_upload_file, delete_upload_file


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


class ProductService:

    async def create(self, db: AsyncSession, data: ProductCreate) -> Product:
        # Verify category exists
        category = await category_crud.get(db, data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )
        product = await product_crud.create(db, obj_in=data.model_dump())
        await db.commit()
        product = await product_crud.get_by_id(db, product.id)
        return product

    async def get_all(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        category_id: Optional[UUID] = None,
        requires_prescription: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> tuple[list[Product], int]:
        return await product_crud.get_all_paginated(
            db,
            skip=skip,
            limit=limit,
            category_id=category_id,
            requires_prescription=requires_prescription,
            search=search,
        )

    async def get_by_id(self, db: AsyncSession, product_id: UUID) -> Product:
        product = await product_crud.get_by_id(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        return product

    async def update(
        self, db: AsyncSession, product_id: UUID, data: ProductUpdate
    ) -> Product:
        product = await product_crud.get(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        if data.category_id:
            category = await category_crud.get(db, data.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found",
                )
        await product_crud.update(db, db_obj=product, obj_in=data.model_dump(exclude_none=True))
        await db.commit()
        return await product_crud.get_by_id(db, product_id)

    async def delete(self, db: AsyncSession, product_id: UUID) -> None:
        product = await product_crud.get(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        await product_crud.delete(db, db_obj=product)
        await db.commit()

    async def add_image(
        self,
        db: AsyncSession,
        product_id: UUID,
        file: UploadFile,
        is_primary: bool = False,
    ) -> Product:
        product = await product_crud.get_by_id(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        file_name, file_type, url = await save_upload_file(file)

        await product_crud.add_image(db, {
            "product_id": product_id,
            "file_name": file_name,
            "file_type": file_type,
            "url": url,
            "is_primary": is_primary,
        })
        await db.commit()
        return await product_crud.get_by_id(db, product_id)


    async def delete_image(
        self, db: AsyncSession, product_id: UUID, image_id: UUID
    ) -> None:
        image = await product_crud.get_image_by_id(db, image_id)
        if not image or image.product_id != product_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        # Delete physical file first
        delete_upload_file(image.file_name)

        await product_crud.delete_image(db, image)
        await db.commit()


category_service = CategoryService()
product_service = ProductService()