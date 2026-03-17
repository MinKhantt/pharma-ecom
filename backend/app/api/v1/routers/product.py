from fastapi import APIRouter, status, Depends, Query, UploadFile, File, Form
from uuid import UUID
from typing import Optional

from app.db.database import async_session
from app.schemas.product import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from app.services.product_service import category_service, product_service
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from fastapi import HTTPException

router = APIRouter(tags=["products"])


# ── Categories (admin only) ───────────────────────────────────────────────────

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return await category_service.create(db, data)


@router.get("/categories", response_model=list[CategoryResponse])
async def get_all_categories(db: async_session):
    return await category_service.get_all(db)


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID, db: async_session):
    return await category_service.get_by_id(db, category_id)


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return await category_service.update(db, category_id, data)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    await category_service.delete(db, category_id)


# ── Products ──────────────────────────────────────────────────────────────────

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return await product_service.create(db, data)


@router.get("/products", response_model=ProductListResponse)
async def get_all_products(
    db: async_session,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    category_id: Optional[UUID] = Query(default=None),
    requires_prescription: Optional[bool] = Query(default=None),
    search: Optional[str] = Query(default=None),
):
    products, total = await product_service.get_all(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        requires_prescription=requires_prescription,
        search=search,
    )
    return ProductListResponse(items=products, total=total, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: async_session):
    return await product_service.get_by_id(db, product_id)


@router.patch("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return await product_service.update(db, product_id, data)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    await product_service.delete(db, product_id)


# ── Product images (admin only) ───────────────────────────────────────────────

@router.post(
    "/products/{product_id}/images",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_product_image(
    product_id: UUID,
    db: async_session,
    file: UploadFile = File(...),
    is_primary: bool = Form(default=False),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return await product_service.add_image(db, product_id, file, is_primary)


@router.delete(
    "/products/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_product_image(
    product_id: UUID,
    image_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    await product_service.delete_image(db, product_id, image_id)