# Pharmacy Shop System — Backend API

A full-featured pharmacy e-commerce backend built with **FastAPI**, **SQLAlchemy (async)**, **PostgreSQL**, and **Redis**. Includes product management, orders, payments, real-time chat, and an AI chatbot.

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
- [WebSocket](#websocket)
- [File Uploads](#file-uploads)
- [Authentication Flow](#authentication-flow)
- [Role & Permission System](#role--permission-system)

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
│   │           └── ai_chat.py
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
│   │   └── ai_chat_crud.py
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
│   │   └── customer.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── chat.py
│   │   └── ai_chat.py
│   ├── services/
│   │   ├── user_service.py
│   │   ├── product_service.py
│   │   ├── cart_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   ├── chat_service.py
│   │   └── ai_chat_service.py
│   └── scripts/
│       └── create_admin.py
├── alembic/
│   ├── env.py
│   └── versions/
├── uploads/
│   └── products/                  # Uploaded product images
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

### 7. Create uploads directory

```bash
mkdir uploads
```

---

## Environment Variables In

```.env.example
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

---

## Creating an Admin User

```bash
python -m app.scripts.create_admin
```

Default credentials:
- Email: `admin@pharmacy.com`
- Password: `admin1234`

Change these immediately after first login.

---

## API Reference

All endpoints are prefixed with `/api/v1`.

---

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/create-admin` | No | Create new admin. Returns JWT tokens. |
| POST | `/auth/register` | No | Register new user. Returns JWT tokens. |
| POST | `/auth/login` | No | Login with email and password. Returns JWT tokens. |
| GET | `/auth/google` | No | Redirect to Google OAuth login. |
| GET | `/auth/google/callback` | No | Google OAuth callback. Returns JWT tokens. |
| POST | `/auth/refresh` | No | Exchange refresh token for new token pair. |
| POST | `/auth/logout` | Yes | Blacklist current access token. |

**Create admin request:**
```json
{
  "full_name": "string",
  "email": "user@example.com",
  "password": "string",
  "secret_key": "string"
}
```

**Register request:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login request:**
```json
{
  "email": "john@example.com",
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

**Refresh request:**
```json
{
  "refresh_token": "eyJ..."
}
```

---

### Users

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/users/me/profile` | Yes | Customer | Complete profile after register. |
| GET | `/users/me` | Yes | Customer | Get current user with profile. |
| PATCH | `/users/me` | Yes | Customer | Update name, phone, date of birth, avatar. |
| PATCH | `/users/me/password` | Yes | Customer | Change password. |
| GET | `/users/` | Yes | Admin | List all users. |
| GET | `/users/{user_id}` | Yes | Admin | Get user by ID. |
| PATCH | `/users/{user_id}` | Yes | Admin | Update any user. |
| DELETE | `/users/{user_id}` | Yes | Admin | Delete user. |

**Complete profile request:**
```json
{
  "phone_number": "09123456789",
  "date_of_birth": "1995-01-15",
  "avatar_url": "https://...",
  "address": "123 Main St, Yangon"
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
| POST | `/products/{id}/images` | Yes | Admin | Upload product image. |
| DELETE | `/products/{id}/images/{image_id}` | Yes | Admin | Delete product image. |

**Product list query params:**
```
GET /products?skip=0&limit=20&category_id=<uuid>&requires_prescription=false&search=paracetamol
```

**Create product request:**
```json
{
  "name": "Paracetamol 500mg",
  "manufacturer": "ABC Pharma",
  "price": 5000,
  "inventory": 100,
  "description": "Pain relief tablet",
  "requires_prescription": false,
  "category_id": "uuid-here"
}
```

**Image upload:** `multipart/form-data` with `file` field. Allowed types: `jpeg`, `png`, `webp`. Max size: 5MB.

---

### Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/cart` | Yes | Get current user's cart. |
| POST | `/cart/items` | Yes | Add item to cart. |
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
| GET | `/orders/me` | Yes | Customer | List my orders. |
| GET | `/orders/me/{order_id}` | Yes | Customer | Get my order by ID. |
| PATCH | `/orders/me/{order_id}/cancel` | Yes | Customer | Cancel an order. |
| POST | `/orders/me/{order_id}/prescription` | Yes | Customer | Upload prescription for Rx orders. |
| GET | `/orders` | Yes | Admin | List all orders. |
| GET | `/orders/{order_id}` | Yes | Admin | Get any order by ID. |
| PATCH | `/orders/{order_id}/status` | Yes | Admin | Update order status. |

**Checkout request:**
```json
{
  "delivery_address": "123 Main St, Yangon",
  "notes": "Leave at the door"
}
```

**Order statuses:**
```
pending → confirmed → processing → ready_for_pickup / shipped → delivered
pending / awaiting_prescription → cancelled → refunded
```

**If any cart item has `requires_prescription=true`, order starts as `awaiting_prescription`. Customer must upload prescription before order can be processed.**

**Update status request (admin):**
```json
{
  "status": "confirmed"
}
```

---

### Payments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/payments` | Yes | Customer | Pay for an order. Instantly completed. |
| GET | `/payments/orders/{order_id}` | Yes | Customer | Get payment for my order. |
| POST | `/payments/orders/{order_id}/refund` | Yes | Customer | Request refund (order must be cancelled first). |
| GET | `/payments/{payment_id}` | Yes | Admin | Get payment by ID. |
| GET | `/payments/orders/{order_id}/admin` | Yes | Admin | Get payment for any order. |

**Create payment request:**
```json
{
  "order_id": "uuid-here",
  "method": "credit_card"
}
```

**Payment methods:** `credit_card`, `debit_card`, `bank_transfer`, `cash_on_delivery`

**Note:** This is a fake payment system for demonstration. Payment is instantly marked as `COMPLETED` on creation. Card details are handled on the frontend only and never sent to the backend.

**Refund flow:**
1. Cancel order: `PATCH /orders/me/{order_id}/cancel`
2. Request refund: `POST /payments/orders/{order_id}/refund`

---

### Chat

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/chat/conversations` | Yes | Customer | Start conversation with admin or continue existing one. |
| GET | `/chat/conversations` | Yes | Customer | List my conversations. |
| GET | `/chat/conversations/{id}` | Yes | Customer | Get conversation with messages. |
| GET | `/chat/conversations/{id}/messages` | Yes | Customer | Get messages with pagination. |
| POST | `/chat/conversations/{id}/messages` | Yes | Customer | Send a message. |
| POST | `/chat/conversations/{id}/read` | Yes | Customer | Mark messages as read. |
| GET | `/chat/admin/conversations` | Yes | Admin | List all customer conversations. |
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

---

### AI Chat

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ai-chat` | Yes | Send message to AI assistant. |
| GET | `/ai-chat/history` | Yes | Load full chat history. |
| DELETE | `/ai-chat/history` | Yes | Clear chat history. |

**Send message request:**
```json
{
  "message": "Do you have any medicine for headache?"
}
```

**Response:**
```json
{
  "reply": "Yes, we carry several headache medicines...",
  "history": [
    { "id": "uuid", "role": "user", "content": "...", "created_at": "..." },
    { "id": "uuid", "role": "assistant", "content": "...", "created_at": "..." }
  ]
}
```

---

## WebSocket

### Admin WebSocket

Admin connects once after login. Stays open to receive all customer messages in real time.

```
ws://localhost:8000/api/v1/chat/ws/admin?token=<access_token>
```

**Events received by admin:**
```json
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
{ "event": "new_message", "message_id": "...", "sender_id": "...", "content": "...", "created_at": "..." }
```

**Note:** Token is passed as a query parameter because browsers do not support custom headers in WebSocket connections.

---

## File Uploads

Product images are uploaded via `multipart/form-data` and stored locally in `uploads/products/`.

- **Allowed types:** `image/jpeg`, `image/png`, `image/webp`
- **Max file size:** 5MB
- **Served at:** `http://localhost:8000/uploads/products/<filename>`

For production, replace local storage with S3 or Cloudinary by updating `app/core/file_upload.py`.

---

## Authentication Flow

```
Register → JWT (access + refresh) → Complete Profile → access protected routes

Login → JWT (access + refresh) → access protected routes

Token expired → POST /auth/refresh with refresh token → new token pair

Logout → POST /auth/logout → access token blacklisted in Redis
```

### Using JWT in requests

Add the access token to the `Authorization` header:

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
| Customer | `False` | Own profile, cart, orders, payments, chat, AI chat |
| Admin | `True` | Everything — manage products, categories, all orders, all users, all conversations |

Customers must complete their profile (`is_profile_complete=True`) before accessing protected routes like cart, orders, and chat.

Google OAuth users are automatically marked as `is_profile_complete=True` after the profile setup step.
