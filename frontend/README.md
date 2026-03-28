# PharmaShop Frontend

A modern pharmacy e-commerce frontend built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| shadcn/ui (Radix UI) | Component library |
| React Router v6 | Routing |
| TanStack Query | Server state & caching |
| Zustand | Global client state |
| Axios | HTTP client with auto token refresh |
| React Hook Form + Zod | Form validation |
| Sonner | Toast notifications |
| Native WebSocket API | Real-time chat |

## Setup & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different port:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1
```

### 3. Start development server

```bash
npm run dev
```

App runs at: **http://localhost:3000**

### 4. Build for production

```bash
npm run build
```

## Project Structure

```
src/
├── api/              # All API calls (axios-based)
│   ├── axios.ts      # Axios instance + auto token refresh
│   ├── auth.ts
│   ├── users.ts
│   ├── products.ts
│   ├── cart.ts
│   ├── orders.ts
│   ├── payments.ts
│   ├── chat.ts
│   └── aiChat.ts
├── components/
│   ├── ui/           # Base shadcn/ui components
│   ├── layout/       # CustomerLayout, AdminLayout, ProtectedRoute
│   └── shared/       # ProductCard, OrderStatusBadge, etc.
├── hooks/            # Custom React hooks
├── lib/              # utils, constants
├── pages/
│   ├── auth/         # Login, Register, CompleteProfile
│   ├── customer/     # Home, Products, Cart, Orders, Chat, AI Chat, Profile
│   └── admin/        # Dashboard, Products, Orders, Users, Payments, Chat
├── store/            # Zustand stores (auth, cart, chat)
├── types/            # TypeScript interfaces matching backend schemas
├── App.tsx           # Routes
└── main.tsx          # Entry point
```

## Pages

### Customer
| Route | Page |
|---|---|
| `/login` | Login |
| `/register` | Register |
| `/complete-profile` | Complete profile (required after register) |
| `/` | Home — featured products, categories |
| `/products` | Product listing with search & filters |
| `/products/:id` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Checkout with payment |
| `/orders` | My orders |
| `/orders/:id` | Order detail + prescription upload |
| `/chat` | Chat with pharmacist (real-time WebSocket) |
| `/ai-chat` | AI assistant (OpenRouter) |
| `/profile` | Profile & password management |

### Admin
| Route | Page |
|---|---|
| `/admin` | Dashboard with stats & recent orders |
| `/admin/products` | Product management (CRUD + image upload) |
| `/admin/orders` | Order management + status update |
| `/admin/users` | User management |
| `/admin/payments` | Payment overview |
| `/admin/chat` | Real-time customer chat (WebSocket) |

## Key Features

### Auto Token Refresh
Axios interceptor automatically calls `POST /auth/refresh` when a request returns 401, then retries the original request. No manual token management needed.

### Real-time Chat
- **Customer** — WebSocket opens when entering the chat page
- **Admin** — WebSocket opens on login, stays open to receive all customer messages

### Fake Payment
Card number, expiry, and CVV fields are frontend-only for demo purposes. Only the payment method is sent to the backend.

### Route Protection
- `ProtectedRoute` — requires login + complete profile
- `AdminRoute` — requires `is_superuser: true`
- `GuestRoute` — redirects logged-in users away from auth pages
