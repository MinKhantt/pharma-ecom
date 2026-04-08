from fastapi import APIRouter, Depends
from fastapi import status as http_status
from uuid import UUID

from app.db.database import async_session
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.payment_service import payment_service
from app.api.v1.dependencies import get_current_active_profile, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Customer endpoints ────────────────────────────────────────────────────────


@router.post(
    "", response_model=PaymentResponse, status_code=http_status.HTTP_201_CREATED
)
async def create_payment(
    data: PaymentCreate,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    """
    Pay for an order. For this school project payment is instantly completed.
    Call this after checkout with the order_id and chosen payment method.
    """
    return await payment_service.create_payment(db, current_user.id, data)


@router.get("/orders/{order_id}", response_model=PaymentResponse)
async def get_my_payment(
    order_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    """Get payment details for one of your orders."""
    return await payment_service.get_payment_by_order(db, current_user.id, order_id)


@router.post("/orders/{order_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    order_id: UUID,
    db: async_session,
    current_user: User = Depends(get_current_active_profile),
):
    """
    Request a refund. Order must be cancelled first.
    Cancel the order via PATCH /orders/me/{order_id}/cancel then call this.
    """
    return await payment_service.refund_payment(db, current_user.id, order_id)


# ── Admin endpoints ───────────────────────────────────────────────────────────


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await payment_service.get_payment_by_id(db, payment_id)


@router.get("/orders/{order_id}/admin", response_model=PaymentResponse)
async def admin_get_payment_by_order(
    order_id: UUID,
    db: async_session,
    admin: User = Depends(get_current_admin),
):
    return await payment_service.admin_get_payment_by_order(db, order_id)
