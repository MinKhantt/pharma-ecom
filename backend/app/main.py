from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.api.v1.routers import (
    auth,
    user,
    product,
    category,
    cart,
    order,
    payment,
    chat,
    ai_chat,
    dashboard,
    review,
    article,
)

app = FastAPI(
    title="Pharmacy Shop API",
    description="Backend for pharmacy e-commerce with admin chat and AI chatbot.",
    version="1.0.0",
    debug=settings.DEBUG,
)

uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(exist_ok=True)
(uploads_dir / "products").mkdir(exist_ok=True)
(uploads_dir / "prescriptions").mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="lax",
    https_only=False,  # Set to True in production with HTTPS
)

api_prefix_v1 = f"{settings.API_PREFIX}{settings.API_V1}"

app.include_router(auth.router, prefix=api_prefix_v1)
app.include_router(user.router, prefix=api_prefix_v1)
app.include_router(product.router, prefix=api_prefix_v1)
app.include_router(category.router, prefix=api_prefix_v1)
app.include_router(cart.router, prefix=api_prefix_v1)
app.include_router(order.router, prefix=api_prefix_v1)
app.include_router(payment.router, prefix=api_prefix_v1)
app.include_router(chat.router, prefix=api_prefix_v1)
app.include_router(ai_chat.router, prefix=api_prefix_v1)
app.include_router(dashboard.router, prefix=api_prefix_v1)
app.include_router(review.router, prefix=api_prefix_v1)
app.include_router(article.router, prefix=api_prefix_v1)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
