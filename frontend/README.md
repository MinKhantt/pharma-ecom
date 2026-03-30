# Shwe La Min Pharmacy — Frontend

A modern pharmacy e-commerce frontend built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| shadcn/ui (Radix UI) | Component library |
| React Router v6 | Routing |
| TanStack Query v5 | Server state & data fetching |
| Zustand | Global client state (auth, cart) |
| Axios | HTTP client with auto token refresh |
| React Hook Form + Zod | Form validation |
| Sonner | Toast notifications |
| Chart.js | Admin dashboard charts |
| Quill | Rich text editor for articles |
| Native WebSocket API | Real-time chat |

---

## Setup & Run

### 1. Install dependencies

```bash
npm install
```

### 2. Install optional packages

```bash
# Rich text editor (for article management)
npm install quill
npm install --save-dev @types/quill

# Tailwind typography plugin (for article rendering)
npm install @tailwindcss/typography
```

Add to `tailwind.config.js`:
```js
plugins: [require("@tailwindcss/typography")],
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a different port:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/api/v1
```

### 4. Start development server

```bash
npm run dev
```

App runs at: **http://localhost:3000**

### 5. Build for production

```bash
npm run build
```

---

## Project Structure

```
src/
├── api/                  # All API calls (axios-based)
│   ├── axios.ts          # Axios instance + auto token refresh
│   ├── auth.ts
│   ├── users.ts
│   ├── products.ts
│   ├── cart.ts
│   ├── orders.ts
│   ├── payments.ts
│   ├── chat.ts
│   ├── aiChat.ts
│   ├── reviews.ts
│   ├── articles.ts
│   └── dashboard.ts
├── components/
│   ├── ui/               # Base shadcn/ui components
│   ├── layout/           # PublicLayout, CustomerLayout, AdminLayout, ProtectedRoute, Footer
│   └── shared/           # ProductCard, OrderStatusBadge, LoadingSpinner, ErrorBoundary, ScrollToTop
├── hooks/
│   ├── useAuth.ts
│   └── useCart.ts
├── lib/
│   ├── utils.ts          # cn, formatCurrency, formatDate
│   └── constants.ts      # API_BASE_URL, WS_BASE_URL, ORDER_STATUSES, PAYMENT_METHODS
├── pages/
│   ├── auth/             # Login, Register, CompleteProfile, GoogleCallback
│   ├── customer/         # All customer-facing pages
│   └── admin/            # All admin pages
├── store/
│   ├── authStore.ts      # Zustand — user, tokens, isAuthenticated
│   ├── cartStore.ts      # Zustand — cart items, total
│   └── chatStore.ts      # Zustand — chat state
├── types/
│   └── index.ts          # TypeScript interfaces matching backend schemas
├── App.tsx               # Route definitions
└── main.tsx              # Entry point
```

---

## Pages

### Public (no login required)

| Route | Page |
|---|---|
| `/` | Home — hero, categories, featured products, reviews, articles |
| `/products` | Product listing with search & filters |
| `/products/:id` | Product detail |
| `/articles` | Health articles listing with category filter |
| `/articles/:slug` | Article detail with HTML content rendering |
| `/about` | About Shwe La Min Pharmacy |
| `/faq` | Frequently asked questions with search |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |

### Auth

| Route | Page |
|---|---|
| `/login` | Login with email/password or Google |
| `/register` | Register with email/password or Google |
| `/complete-profile` | Complete profile after first login (required) |
| `/auth/google/callback` | Google OAuth callback handler |

### Customer (login required)

| Route | Page |
|---|---|
| `/cart` | Shopping cart with quantity controls |
| `/checkout` | Checkout with address, payment method, card validation |
| `/orders` | My orders list |
| `/orders/:id` | Order detail — prescription upload, cancel, return request, review prompt |
| `/change-password` | Dedicated change password page |
| `/chat` | Real-time chat with pharmacist (WebSocket) |
| `/ai-chat` | AI pharmacy assistant |
| `/profile` | Profile settings with avatar upload, sidebar navigation |

### Admin (admin login required)

| Route | Page |
|---|---|
| `/admin` | Dashboard — stats cards, revenue chart, order status chart, daily orders, recent orders |
| `/admin/categories` | Category management (CRUD) |
| `/admin/products` | Product management (CRUD + image upload) |
| `/admin/orders` | Order listing with status filter |
| `/admin/orders/:id` | Order detail — prescription viewer, customer info, return approve/reject |
| `/admin/users` | User management |
| `/admin/payments` | Payment overview |
| `/admin/chat` | Real-time customer chat with customer name & avatar |
| `/admin/reviews` | Review moderation — approve or delete |
| `/admin/articles` | Article management — rich text editor, cover image upload, publish toggle |

---

## Key Features

### Auto Token Refresh
Axios interceptor automatically calls `POST /auth/refresh` when any request returns 401, retries the original request with the new token, and queues concurrent requests during refresh. On refresh failure, the user is logged out and redirected to `/login`.

### Route Protection

| Guard | Behavior |
|---|---|
| `PublicLayout` | Anyone can access. Navbar shows Login/Register for guests, full menu for customers, redirects admin to `/admin`. |
| `ProtectedRoute` | Requires login + `is_profile_complete`. Redirects admin to `/admin`. |
| `AdminRoute` | Requires `is_superuser: true`. |
| `GuestRoute` | Redirects logged-in users away from auth pages. |

### Cart State
Cart is fetched once on layout mount and stored in Zustand. All mutations (`addItem`, `updateItem`, `removeItem`) call `setCart` on success, which triggers instant re-render of the navbar badge — no page reload required. Items are sorted alphabetically to prevent reordering on updates.

### Real-time Chat
- **Customer** — WebSocket connects when the chat page is opened, closes when left
- **Admin** — WebSocket connects on admin login and stays open to receive all customer messages
- Messages are deduplicated by ID to prevent double display

### Google OAuth
Flow: Login page → `GET /api/v1/auth/google` → Google → `/auth/google/callback?access_token=...&refresh_token=...&is_profile_complete=...` → Zustand → redirect to correct page.

### Fake Payment
Card number, expiry, and CVV are validated on the frontend (format, expiry date) for demo purposes. Only the payment method enum is sent to the backend. Card data is never transmitted.

### Reviews
Customers can submit one shop review from any delivered order's detail page. Reviews show a 5-star picker with labels (Poor → Excellent) and a text area. Submitted reviews are pending until an admin approves them. Approved reviews appear on the homepage testimonials section with average rating.

### Articles
Admins write articles using a Quill rich text editor. Content is stored and rendered as HTML. Articles support cover image upload, category tagging (`news`, `health_tips`, `medicine_info`), draft/published status, and auto-generated slugs. Customers can browse and filter articles by category.

### Return Flow
1. Order must be in `delivered` status
2. Customer clicks "Request Return", selects a reason (`damaged`, `wrong_item`, `not_satisfied`) and optional note
3. Order status changes to `return_requested`
4. Admin sees the return details and clicks Approve or Reject
5. Approve → order + payment both change to `refunded`
6. Reject → order reverts to `delivered`

### Dashboard Charts
Admin dashboard uses Chart.js (loaded via CDN in `index.html`) to render:
- **Revenue per day** — filled line chart, last 14 days, with 14-day total and peak day in header
- **Orders by status** — doughnut chart with colour-coded statuses
- **Orders this week** — bar chart, last 7 days

All chart data comes from `GET /api/v1/dashboard/charts`.

---

## State Management

| Store | Contents |
|---|---|
| `authStore` | `user`, `accessToken`, `refreshToken`, `isAuthenticated` — persisted to localStorage |
| `cartStore` | `cart` (items + total) — in-memory, populated on login |
| `chatStore` | Chat UI state |

---

## Error Handling

A class-based `ErrorBoundary` wraps the entire app. When any component throws, it displays the error message and stack trace on screen instead of a blank white page. Useful for catching runtime errors during development.

`ScrollToTop` component resets scroll position to the top on every route change.

---

## Design System

- **Fonts:** DM Sans (body) + Playfair Display (headings) + JetBrains Mono
- **Color:** Green pharmacy palette — `--primary: 155 60% 30%`
- **Theme:** CSS variables for light/dark mode
- **Components:** shadcn/ui with Tailwind utility classes
- **Navbar:** Glass effect with backdrop blur
