# Shwe La Min Pharmacy — Backend API

A full-featured pharmacy e-commerce backend built with **FastAPI**, **SQLAlchemy (async)**, **PostgreSQL**, and **Redis**. Includes product management, orders, payments, real-time chat, AI chatbot, customer reviews, articles, and a dashboard statistics API.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Database Migrations](#database-migrations)
- [Creating an Admin User](#creating-an-admin-user)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Products & Categories](#products--categories)
  - [Cart](#cart)
  - [Orders](#orders)
  - [Payments](#payments)
  - [Chat](#chat)
  - [AI Chat](#ai-chat)
  - [Reviews](#reviews)
  - [Articles](#articles)
  - [Dashboard](#dashboard)
- [WebSocket](#websocket)
- [File Uploads](#file-uploads)
- [Authentication Flow](#authentication-flow)
- [Role & Permission System](#role--permission-system)
- [Order Status Flow](#order-status-flow)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Async DB driver | asyncpg |
| Cache / Token blacklist | Redis |
| Password hashing | Passlib + Argon2 |
| JWT | python-jose |
| Google OAuth | Authlib |
| AI Chatbot | OpenRouter API (OpenAI-compatible) |
| File storage | Local disk (uploads/) |
| Real-time chat | WebSocket |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── api/
│   │   └── v1/
│   │       ├── dependencies.py    # JWT auth dependencies
│   │       └── routers/
│   │           ├── auth.py
│   │           ├── user.py
│   │           ├── product.py
│   │           ├── cart.py
│   │           ├── order.py
│   │           ├── payment.py
│   │           ├── chat.py
│   │           ├── ai_chat.py
│   │           ├── review.py
│   │           ├── article.py
│   │           └── dashboard.py
│   ├── core/
│   │   ├── config.py              # Settings from .env
│   │   ├── security.py            # JWT + password hashing
│   │   ├── redis.py               # Redis client + token blacklist
│   │   ├── google_oauth.py        # Google OAuth setup
│   │   ├── file_upload.py         # Local file upload helpers
│   │   ├── websocket_manager.py   # WebSocket connection manager
│   │   └── ws_auth.py             # WebSocket JWT auth
│   ├── crud/
│   │   ├── user_crud.py
│   │   ├── product_crud.py
│   │   ├── cart_crud.py
│   │   ├── order_crud.py
│   │   ├── payment_crud.py
│   │   ├── chat_crud.py
│   │   ├── ai_chat_crud.py
│   │   ├── review_crud.py
│   │   └── article_crud.py
│   ├── db/
│   │   └── database.py            # Async engine + session
│   ├── models/
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── chat.py
│   │   ├── ai_chat.py
│   │   ├── customer.py
│   │   ├── review.py
│   │   └── article.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── chat.py
│   │   ├── ai_chat.py
│   │   ├── review.py
│   │   └── article.py
│   ├── services/
│   │   ├── user_service.py
│   │   ├── product_service.py
│   │   ├── cart_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   ├── chat_service.py
│   │   ├── ai_chat_service.py
│   │   ├── review_service.py
│   │   └── article_service.py
│   └── scripts/
│       └── create_admin.py
├── alembic/
│   ├── env.py
│   └── versions/
├── uploads/
│   ├── products/                  # Uploaded product images & avatars
│   └── prescriptions/             # Uploaded prescription files
├── alembic.ini
├── requirements.txt
└── .env
```

---

## Setup & Installation

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- Redis (or Docker)
- uv

### 1. Clone and create virtual environment

```bash
git clone <repo>
cd backend
```

### 2. Install dependencies

```bash
uv sync

# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate
```

### 3. Start Redis

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 5. Run migrations

```bash
alembic upgrade head
```

### 6. Create admin user

```bash
python -m app.scripts.create_admin
```

### 7. Create uploads directories

```bash
mkdir -p uploads/products uploads/prescriptions
```

---

## Environment Variables

```env
# Database
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=pharmacy_shop_db
DB_PORT=5432
DB_HOST=localhost

# API
API_PREFIX=/api
API_V1=/v1
DEBUG=True

# JWT
ALGORITHM=HS256
SECRET_KEY=your-32-byte-hex-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# File uploads
UPLOAD_DIR=uploads
BASE_URL=http://localhost:8000

# OpenRouter AI
OPENROUTER_API_KEY=your-openrouter-key

# Admin creation secret
ADMIN_SECRET_KEY=your-admin-secret
```

---

## Running the Server

```bash
uvicorn app.main:app --reload
```

API docs available at: `http://localhost:8000/docs`  
ReDoc available at: `http://localhost:8000/redoc`

---

## Database Migrations

```bash
# Generate new migration after model changes
alembic revision --autogenerate -m "description"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

> **Note:** PostgreSQL enum types are not detected by Alembic autogenerate.
> For new enum values, write a manual migration:
> ```python
> def upgrade():
>     op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'return_requested'")
> ```

---

## Creating an Admin User

```bash
python -m app.scripts.create_admin
```

Default credentials:
- Email: `admin@shwelamiiin.com`
- Password: `admin1234`

**Change these immediately after first login.**

---

## API Reference

All endpoints are prefixed with `/api/v1`.

---

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register new customer. Returns JWT tokens. |
| POST | `/auth/login` | No | Login with email and password. Returns JWT tokens. |
| GET | `/auth/google` | No | Redirect to Google OAuth login. |
| GET | `/auth/google/callback` | No | Google OAuth callback. Redirects to frontend with tokens. |
| POST | `/auth/refresh` | No | Exchange refresh token for new token pair. |
| POST | `/auth/logout` | Yes | Blacklist current access token. |
| POST | `/auth/create-admin` | No | Create admin user (requires `ADMIN_SECRET_KEY`). |

**Register request:**
```json
{
  "full_name": "Min Khant Maung",
  "email": "min@example.com",
  "password": "password123"
}
```

**Login request:**
```json
{
  "email": "min@example.com",
  "password": "password123"
}
```

**Login / Register response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "is_profile_complete": false,
  "user": { ... }
}
```

**Google OAuth flow:**
1. Frontend redirects user to `GET /api/v1/auth/google`
2. User authenticates with Google
3. Backend redirects to `{FRONTEND_URL}/auth/google/callback?access_token=...&refresh_token=...&is_profile_complete=true/false`
4. Frontend reads tokens from URL and stores them

---

### Users

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/users/me/profile` | Yes | Customer | Complete profile after register. |
| GET | `/users/me` | Yes | Any | Get current user with profile. |
| PATCH | `/users/me` | Yes | Customer | Update name, phone, date of birth, address. |
| PATCH | `/users/me/password` | Yes | Customer | Change password. |
| POST | `/users/me/avatar` | Yes | Customer | Upload profile photo (`multipart/form-data`). |
| GET | `/users/` | Yes | Admin | List all users. |
| GET | `/users/{user_id}` | Yes | Admin | Get user by ID. |
| PATCH | `/users/{user_id}` | Yes | Admin | Update any user. |
| DELETE | `/users/{user_id}` | Yes | Admin | Delete user. |

**Complete profile request:**
```json
{
  "phone_number": "09123456789",
  "date_of_birth": "1995-01-15",
  "address": "No.15, Bahan Township, Yangon"
}
```

**Update me request:**
```json
{
  "full_name": "New Name",
  "phone_number": "09987654321",
  "date_of_birth": "1995-01-15",
  "address": "No.15, Bahan Township, Yangon"
}
```

**Change password request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

---

### Products & Categories

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/categories` | No | Public | List all categories. |
| GET | `/categories/{id}` | No | Public | Get category by ID. |
| POST | `/categories` | Yes | Admin | Create category. |
| PATCH | `/categories/{id}` | Yes | Admin | Update category. |
| DELETE | `/categories/{id}` | Yes | Admin | Delete category. |
| GET | `/products` | No | Public | List products with filters. |
| GET | `/products/{id}` | No | Public | Get product by ID. |
| POST | `/products` | Yes | Admin | Create product. |
| PATCH | `/products/{id}` | Yes | Admin | Update product. |
| DELETE | `/products/{id}` | Yes | Admin | Delete product. |
| POST | `/products/{id}/images` | Yes | Admin | Upload product image (`multipart/form-data`). |
| DELETE | `/products/{id}/images/{image_id}` | Yes | Admin | Delete product image. |

**Product list query params:**
```
GET /products?skip=0&limit=20&category_id=<uuid>&requires_prescription=false&search=paracetamol
```

**Create product request:**
```json
{
  "name": "Paracetamol 500mg Tablet",
  "manufacturer": "Myanmar Pharmaceutical Factory",
  "price": 500,
  "inventory": 300,
  "description": "Pain relief and fever reducer.",
  "requires_prescription": false,
  "category_id": "uuid-here"
}
```

**Image upload:** `multipart/form-data` with `file` field.
Allowed types: `jpeg`, `png`, `webp`. Max size: 5MB.

---

### Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/cart` | Yes | Get current user's cart with all items. |
| POST | `/cart/items` | Yes | Add item. If already in cart, quantity is incremented. |
| PATCH | `/cart/items/{item_id}` | Yes | Update item quantity. |
| DELETE | `/cart/items/{item_id}` | Yes | Remove item from cart. |
| DELETE | `/cart` | Yes | Clear entire cart. |

**Add item request:**
```json
{
  "product_id": "uuid-here",
  "quantity": 2
}
```

**Update item request:**
```json
{
  "quantity": 3
}
```

---

### Orders

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/orders` | Yes | Customer | Checkout — creates order from cart. |
| GET | `/orders/me` | Yes | Customer | List my orders with optional status filter. |
| GET | `/orders/me/{order_id}` | Yes | Customer | Get my order by ID. |
| PATCH | `/orders/me/{order_id}/cancel` | Yes | Customer | Cancel an order. |
| POST | `/orders/me/{order_id}/prescription` | Yes | Customer | Upload prescription (`multipart/form-data`). |
| POST | `/orders/me/{order_id}/return` | Yes | Customer | Request a return for a delivered order. |
| GET | `/orders` | Yes | Admin | List all orders with optional status filter. |
| GET | `/orders/{order_id}` | Yes | Admin | Get any order by ID (includes user info). |
| PATCH | `/orders/{order_id}/status` | Yes | Admin | Update order status. |
| PATCH | `/orders/{order_id}/return` | Yes | Admin | Approve or reject a return request. |

**Checkout request:**
```json
{
  "delivery_address": "No.15, Bahan Township, Yangon",
  "notes": "Leave at reception"
}
```

**If any cart item has `requires_prescription=true`, the order starts as `awaiting_prescription`. The customer must upload a valid prescription before the order can be processed.**

**Request return (customer):**
```json
{
  "reason": "damaged",
  "note": "The packaging was broken on arrival"
}
```

Reason options: `damaged` | `wrong_item` | `not_satisfied`

**Handle return (admin):**
```json
{
  "approve": true
}
```

- `approve: true` → Order and payment both change to `refunded`
- `approve: false` → Order reverts to `delivered`

**Update status request (admin):**
```json
{
  "status": "confirmed"
}
```

**Prescription upload:** `multipart/form-data` with `file` field.
Allowed types: `jpeg`, `png`, `webp`, `pdf`. Max size: 5MB.
Files stored at `uploads/prescriptions/`.

---

### Payments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/payments` | Yes | Customer | Pay for an order. Instantly marked completed. |
| GET | `/payments/orders/{order_id}` | Yes | Customer | Get payment for my order. |
| POST | `/payments/orders/{order_id}/refund` | Yes | Customer | Direct refund (order must be cancelled). |
| GET | `/payments/{payment_id}` | Yes | Admin | Get payment by ID. |
| GET | `/payments/orders/{order_id}/admin` | Yes | Admin | Get payment for any order. |

**Create payment request:**
```json
{
  "order_id": "uuid-here",
  "method": "credit_card"
}
```

**Payment methods:** `credit_card` | `debit_card` | `cash_on_delivery`

**Payment statuses:** `pending` | `completed` | `failed` | `refunded`

> **Note:** This is a simulated payment system for demonstration. Payment is instantly marked `COMPLETED`. Card details are handled on the frontend only and never sent to the server.

---

### Chat

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/chat/conversations` | Yes | Customer | Start or continue conversation with pharmacist. |
| GET | `/chat/conversations` | Yes | Customer | List my conversations. |
| GET | `/chat/conversations/{id}` | Yes | Customer | Get conversation with messages. |
| GET | `/chat/conversations/{id}/messages` | Yes | Customer | Get messages (paginated). |
| POST | `/chat/conversations/{id}/messages` | Yes | Customer | Send a message. |
| POST | `/chat/conversations/{id}/read` | Yes | Customer | Mark messages as read. |
| GET | `/chat/admin/conversations` | Yes | Admin | List all conversations (includes customer name & avatar). |
| GET | `/chat/admin/conversations/{id}` | Yes | Admin | Get conversation by ID. |
| POST | `/chat/admin/conversations/{id}/messages` | Yes | Admin | Reply to customer. |
| POST | `/chat/admin/conversations/{id}/read` | Yes | Admin | Mark messages as read. |

**Start conversation request:**
```json
{
  "message": "Hello, I need help with my prescription."
}
```

**Send message request:**
```json
{
  "content": "Do you have paracetamol in stock?"
}
```

> Each customer has one conversation with the pharmacy. Calling `POST /chat/conversations` on an existing conversation sends a new message instead of creating a duplicate.

---

### AI Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ai-chat` | Yes | Send message to AI assistant. Returns reply + full history. |
| GET | `/ai-chat/history` | Yes | Load full chat history for current user. |
| DELETE | `/ai-chat/history` | Yes | Clear chat history. |

**Send message request:**
```json
{
  "message": "What is paracetamol used for?"
}
```

**Response:**
```json
{
  "reply": "Paracetamol is used for mild to moderate pain relief and fever reduction...",
  "history": [
    { "id": "uuid", "role": "user", "content": "...", "created_at": "..." },
    { "id": "uuid", "role": "assistant", "content": "...", "created_at": "..." }
  ]
}
```

> Powered by OpenRouter API. The AI is configured as a pharmacy assistant and will not provide medical diagnoses.

---

### Reviews

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/reviews` | No | Public | List approved reviews (paginated). |
| POST | `/reviews` | Yes | Customer | Submit a shop review. One per user. |
| GET | `/reviews/me` | Yes | Customer | Get my own review. |
| GET | `/reviews/admin` | Yes | Admin | List all reviews including pending. |
| PATCH | `/reviews/{id}/approve` | Yes | Admin | Approve a review (makes it publicly visible). |
| DELETE | `/reviews/{id}` | Yes | Admin | Delete a review. |

**Submit review request:**
```json
{
  "rating": 5,
  "comment": "Excellent service and fast delivery. Highly recommend."
}
```

**Rules:**
- Customer must have at least one `delivered` order to submit a review
- Each customer can only submit one review (one per user, no editing)
- Reviews are hidden until approved by an admin
- Approved reviews appear on the public homepage

---

### Articles

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/articles` | No | Public | List published articles with optional category filter. |
| GET | `/articles/{slug}` | No | Public | Get single published article by slug. |
| GET | `/articles/admin/all` | Yes | Admin | List all articles including drafts. |
| POST | `/articles` | Yes | Admin | Create new article. |
| POST | `/articles/{id}/cover` | Yes | Admin | Upload cover image (`multipart/form-data`). |
| PATCH | `/articles/{id}` | Yes | Admin | Update content, category, or publish status. |
| DELETE | `/articles/{id}` | Yes | Admin | Delete article. |

**Article list query params:**
```
GET /articles?skip=0&limit=10&category=health_tips
```

**Article categories:** `news` | `health_tips` | `medicine_info`

**Create article request:**
```json
{
  "title": "5 Tips for Storing Medicines at Home",
  "content": "<p>Storing medicines correctly is essential...</p>",
  "excerpt": "Learn how to safely store your medicines at home.",
  "category": "health_tips",
  "is_published": true
}
```

**Content format:** HTML (produced by the rich text editor on the frontend).  
**Slug:** Auto-generated from title. Guaranteed unique.  
**Cover image upload:** `multipart/form-data` with `file` field. Allowed: `jpeg`, `png`, `webp`. Max: 5MB.

---

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/dashboard/stats` | Yes | Admin | Summary stats: orders, users, products, revenue. |
| GET | `/dashboard/charts` | Yes | Admin | Chart data for revenue, order status, and daily activity. |

**Stats response:**
```json
{
  "total_orders": 42,
  "total_users": 15,
  "total_products": 67,
  "total_revenue": "325000.00"
}
```

**Charts response:**
```json
{
  "orders_by_status": {
    "pending": 3,
    "confirmed": 8,
    "delivered": 28,
    "cancelled": 3
  },
  "orders_by_day": [
    { "day": "Mon", "count": 4 },
    { "day": "Tue", "count": 7 }
  ],
  "revenue_by_day": [
    { "day": "Mar 15", "total": 25000.0 },
    { "day": "Mar 16", "total": 18500.0 }
  ]
}
```

> Revenue is summed from `COMPLETED` payments only. `revenue_by_day` covers the last 14 days. `orders_by_day` covers the last 7 days.

---

## WebSocket

### Admin WebSocket

Admin connects once after login. Stays open to receive all customer messages in real time.

```
ws://localhost:8000/api/v1/chat/ws/admin?token=<access_token>
```

**Events received by admin:**
```json
{ "event": "connected", "role": "admin" }
{ "event": "new_message", "message_id": "...", "conversation_id": "...", "sender_id": "...", "content": "...", "created_at": "..." }
{ "event": "new_conversation", "conversation_id": "...", "content": "..." }
```

### Customer WebSocket

Customer connects when they open a conversation page. Closes when they leave.

```
ws://localhost:8000/api/v1/chat/ws/conversations/{conversation_id}?token=<access_token>
```

**Events received by customer:**
```json
{ "event": "connected", "role": "customer" }
{ "event": "new_message", "message_id": "...", "sender_id": "...", "content": "...", "created_at": "..." }
```

> Token is passed as a query parameter because browsers do not support custom headers in WebSocket connections.

---

## File Uploads

Files are stored locally and served as static files via FastAPI's `StaticFiles` mount.

| Type | Endpoint | Directory | Allowed types |
|---|---|---|---|
| Product images | `POST /products/{id}/images` | `uploads/products/` | jpeg, png, webp |
| Prescriptions | `POST /orders/me/{id}/prescription` | `uploads/prescriptions/` | jpeg, png, webp, pdf |
| Profile avatars | `POST /users/me/avatar` | `uploads/products/` | jpeg, png, webp |
| Article covers | `POST /articles/{id}/cover` | `uploads/products/` | jpeg, png, webp |

**Max file size:** 5MB for all uploads.

**Served at:** `http://localhost:8000/uploads/<folder>/<filename>`

> For production, replace local disk storage with AWS S3 or Cloudinary by updating `app/core/file_upload.py`.

---

## Authentication Flow

```
Register → JWT (access + refresh) → Complete Profile → access protected routes

Google Sign-Up / Login → Google OAuth → backend redirects to frontend with tokens
                       → New users must Complete Profile → then access protected routes

Login → JWT (access + refresh) → access protected routes

Token expired → POST /auth/refresh with refresh token → new access + refresh pair

Logout → POST /auth/logout → access token blacklisted in Redis
```

### Using JWT in requests

```
Authorization: Bearer <access_token>
```

### Token expiry

| Token | Default expiry |
|---|---|
| Access token | 30 minutes |
| Refresh token | 7 days |

---

## Role & Permission System

| Role | `is_superuser` | Access |
|---|---|---|
| Guest (unauthenticated) | — | Products, categories, public articles, public reviews |
| Customer | `False` | Profile, cart, orders, payments, chat, AI chat, submit review |
| Admin | `True` | Full access — all of the above plus product/category/article management, all orders, all users, reviews moderation, dashboard |

Customers must complete their profile (`is_profile_complete=True`) before accessing protected routes such as cart, orders, and chat. Guests can browse products and read articles without an account.

---

## Order Status Flow

```
Normal order:
  pending → confirmed → processing → ready_for_pickup / shipped → delivered

Prescription order:
  awaiting_prescription → (upload prescription) → pending → confirmed → ... → delivered

Cancellable statuses (customer):
  pending | awaiting_prescription | confirmed | processing → cancelled

Return flow (after delivery):
  delivered → return_requested → (admin approves) → refunded
                               → (admin rejects)  → delivered

Refund via cancellation:
  cancelled → (POST /payments/orders/{id}/refund) → refunded
```

| Status | Description |
|---|---|
| `pending` | Order placed, payment received, awaiting pharmacist confirmation |
| `awaiting_prescription` | Order contains Rx items, waiting for prescription upload |
| `confirmed` | Pharmacist confirmed the order |
| `processing` | Order is being prepared |
| `ready_for_pickup` | Order ready for in-store pickup |
| `shipped` | Order dispatched for delivery |
| `delivered` | Customer received the order |
| `cancelled` | Order cancelled by customer or admin |
| `return_requested` | Customer requested a return after delivery |
| `refunded` | Return approved and payment refunded |
