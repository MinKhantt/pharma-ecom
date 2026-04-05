from fastapi import APIRouter, status, Depends
from uuid import UUID

from app.db.database import async_session
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.category_service import category_service
from app.api.v1.dependencies import get_current_admin
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await category_service.create(db, data)


@router.get("", response_model=list[CategoryResponse])
async def get_all_categories(db: async_session):
    return await category_service.get_all(db)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: UUID, db: async_session):
    return await category_service.get_by_id(db, category_id)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await category_service.update(db, category_id, data)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    await category_service.delete(db, category_id)
