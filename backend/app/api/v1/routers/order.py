from fastapi import APIRouter, status as http_status, Depends, Query, UploadFile, File, HTTPException
from uuid import UUID
from typing import Optional

from app.db.database import async_session
from app.schemas.order import (
    CheckoutRequest,
    OrderResponse,
    OrderListResponse,
    UpdateOrderStatusRequest,
    RequestReturnRequest, 
    ApproveRejectReturnRequest
)
from app.models.order import OrderStatus
from app.services.order_service import order_service
from app.api.v1.dependencies import get_current_user, get_current_active_profile
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["orders"])


# ── Customer endpoints ────────────────────────────────────────────────────────

@router.post("", response_model=OrderResponse, status_code=http_status.HTTP_201_CREATED)
async def checkout(
    data: CheckoutRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await order_service.checkout(db, current_user.id, data)


@router.get("/me", response_model=OrderListResponse)
async def get_my_orders(
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(default=None),
):
    orders, total = await order_service.get_my_orders(
        db, current_user.id, skip=skip, limit=limit, status=status
    )
    return OrderListResponse(items=orders, total=total, skip=skip, limit=limit)


@router.get("/me/{order_id}", response_model=OrderResponse)
async def get_my_order(
    order_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await order_service.get_my_order_by_id(db, current_user.id, order_id)


@router.patch("/me/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await order_service.cancel_order(db, current_user.id, order_id)


@router.post("/me/{order_id}/prescription", response_model=OrderResponse)
async def upload_prescription(
    order_id: UUID,
    db: async_session,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_profile),
):
    return await order_service.upload_prescription(db, current_user.id, order_id, file)

@router.post("/me/{order_id}/return", response_model=OrderResponse)
async def request_return(
    order_id: UUID,
    data: RequestReturnRequest,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    return await order_service.request_return(db, current_user.id, order_id, data)


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("", response_model=OrderListResponse)
async def get_all_orders(
    db: async_session,
    current_user: User = Depends(get_current_user),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[OrderStatus] = Query(default=None),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    orders, total = await order_service.get_all_orders(
        db, skip=skip, limit=limit, status=status
    )
    return OrderListResponse(items=orders, total=total, skip=skip, limit=limit)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return await order_service.get_order_by_id(db, order_id)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    data: UpdateOrderStatusRequest,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return await order_service.update_order_status(db, order_id, data)

@router.patch("/{order_id}/return", response_model=OrderResponse)
async def handle_return(
    order_id: UUID,
    data: ApproveRejectReturnRequest,
    db: async_session,
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    return await order_service.handle_return(db, order_id, data.approve)