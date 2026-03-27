// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_profile_complete?: boolean;
  user: User;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  phone_number: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  address: string | null;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  is_profile_complete: boolean;
  is_superuser: boolean;
  created_at: string;
  profile: Profile | null;
}

export interface CompleteProfileRequest {
  phone_number?: string;
  date_of_birth?: string;
  avatar_url?: string;
  address?: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  avatar_url?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  description: string | null;
}

// ── Product ───────────────────────────────────────────────────────────────────
export interface ProductImage {
  id: string;
  file_name: string;
  file_type: string | null;
  url: string;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  manufacturer: string | null;
  price: number;
  inventory: number;
  description: string | null;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
  category: Category;
  images: ProductImage[];
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateProductRequest {
  name: string;
  manufacturer?: string;
  price: number;
  inventory: number;
  description?: string;
  requires_prescription: boolean;
  category_id: string;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: Product;
}

export interface Cart {
  id: string;
  total_amount: number;
  items: CartItem[];
}

// ── Order ─────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "awaiting_prescription"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "return_requested";

export type ReturnReason = "damaged" | "wrong_item" | "not_satisfied";

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface OrderUser {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  address?: string | null;
}

export interface Order {
  id: string;
  order_date: string;
  total_amount: number;
  status: OrderStatus;
  prescription_ref: string | null;
  delivery_address: string | null;
  notes: string | null;
  updated_at: string;
  user?: OrderUser | null;
  items: OrderItem[];
  return_reason: ReturnReason | null;
  return_note: string | null;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  skip: number;
  limit: number;
}

export interface CheckoutRequest {
  delivery_address: string;
  notes?: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────
export type PaymentMethod = "credit_card" | "debit_card" | "cash_on_delivery";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_id: string;
}

export interface CreatePaymentRequest {
  order_id: string;
  method: PaymentMethod;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatUserResponse {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: ChatUserResponse | null;
}

export interface Message {
  id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_id: string;
  conversation_id: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  members: Member[];
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  updated_at: string;
  members: Member[];
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIChatResponse {
  reply: string;
  history: AIChatMessage[];
}

// ── Review ───────────────────────────────────────────────────────────────────
export interface ReviewAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  user_id: string;
  user: ReviewAuthor | null;
}

export interface ReviewListResponse {
  items: Review[];
  total: number;
}

// ── Article ──────────────────────────────────────────────────────────────────
export type ArticleCategory = "news" | "health_tips" | "medicine_info";

export interface ArticleAuthor {
  id: string;
  full_name: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: ArticleCategory;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: ArticleAuthor | null;
}

export interface ArticleListResponse {
  items: Article[];
  total: number;
  skip: number;
  limit: number;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
export interface WSMessage {
  event: "new_message" | "new_conversation" | "connected";
  message_id?: string;
  conversation_id?: string;
  sender_id?: string;
  content?: string;
  is_read?: boolean;
  created_at?: string;
  role?: string;
}
