from fastapi import APIRouter, status, Depends, Query, UploadFile, File, Form
from uuid import UUID
from typing import Optional

from app.db.database import async_session
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
)
from app.services.product_service import product_service
from app.api.v1.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/products", tags=["products"])


# ── Products ──────────────────────────────────────────────────────────────────


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await product_service.create(db, data)


@router.get("", response_model=ProductListResponse)
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


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: async_session):
    return await product_service.get_by_id(db, product_id)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    data: ProductUpdate,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await product_service.update(db, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    await product_service.delete(db, product_id)


# ── Product images (admin only) ───────────────────────────────────────────────


@router.post(
    "/{product_id}/images",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_product_image(
    product_id: UUID,
    db: async_session,
    file: UploadFile = File(...),
    is_primary: bool = Form(default=False),
    admin: User = Depends(get_current_admin),
):
    return await product_service.add_image(db, product_id, file, is_primary)


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_product_image(
    product_id: UUID,
    image_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    await product_service.delete_image(db, product_id, image_id)
