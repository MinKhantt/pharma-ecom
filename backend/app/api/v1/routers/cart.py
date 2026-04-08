from fastapi import APIRouter, Depends
from app.db.database import async_session
from app.schemas.cart import CartResponse
from app.schemas.cart_item import CartItemAdd, CartItemUpdate
from app.services.cart_service import cart_service
from app.api.v1.dependencies import get_current_user
from app.models.user import User
from uuid import UUID

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
async def get_cart(
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await cart_service.get_cart(db, current_user.id)


@router.post("/items", response_model=CartResponse)
async def add_item(
    data: CartItemAdd,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await cart_service.add_item(db, current_user.id, data)


@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_item(
    item_id: UUID,
    data: CartItemUpdate,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await cart_service.update_item(db, current_user.id, item_id, data)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_item(
    item_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await cart_service.remove_item(db, current_user.id, item_id)


@router.delete("", response_model=CartResponse)
async def clear_cart(
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    return await cart_service.clear_cart(db, current_user.id)
