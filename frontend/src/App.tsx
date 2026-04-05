import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ProtectedRoute, AdminRoute, GuestRoute } from "@/components/layout/ProtectedRoute";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ScrollToTop } from "@/components/shared/ScrollToTop";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import CompleteProfilePage from "@/pages/auth/CompleteProfilePage";
import GoogleCallbackPage from "@/pages/auth/GoogleCallbackPage";

// Customer pages
import HomePage from "@/pages/customer/HomePage";
import ProductsPage from "@/pages/customer/ProductsPage";
import ProductDetailPage from "@/pages/customer/ProductDetailPage";
import CartPage from "@/pages/customer/CartPage";
import CheckoutPage from "@/pages/customer/CheckoutPage";
import OrdersPage from "@/pages/customer/OrdersPage";
import OrderDetailPage from "@/pages/customer/OrderDetailPage";
import ChatPage from "@/pages/customer/ChatPage";
import AIChatPage from "@/pages/customer/AIChatPage";
import ProfilePage from "@/pages/customer/ProfilePage";
import AboutPage         from "@/pages/customer/AboutPage";
import FAQPage           from "@/pages/customer/FAQPage";
import PrivacyPolicyPage from "@/pages/customer/PrivacyPolicyPage";
import TermsPage         from "@/pages/customer/TermsPage";
import ArticlesPage       from "@/pages/customer/ArticlesPage";
import ArticleDetailPage  from "@/pages/customer/ArticleDetailPage";

// Admin pages
import DashboardPage from "@/pages/admin/DashboardPage";
import ProductsAdminPage from "@/pages/admin/ProductsAdminPage";
import OrdersAdminPage from "@/pages/admin/OrdersAdminPage";
import UsersAdminPage from "@/pages/admin/UsersAdminPage";
import PaymentsAdminPage from "@/pages/admin/PaymentsAdminPage";
import ChatAdminPage from "@/pages/admin/ChatAdminPage";
import { PublicLayout } from "./components/layout/PublicLayout";
import OrderDetailsAdminPage from "./pages/admin/OrderDetailsAdminPage";
import CategoriesAdminPage from "@/pages/admin/CategoriesAdminPage";
import ReviewsAdminPage from "@/pages/admin/ReviewsAdminPage";
import ArticlesAdminPage  from "@/pages/admin/ArticlesAdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Guest only routes */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Google OAuth callback */}
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

            {/* Complete profile */}
            <Route path="/complete-profile" element={<CompleteProfilePage />} />

            {/* Public routes — anyone can access, layout adapts */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/about"   element={<AboutPage />} />
              <Route path="/faq"     element={<FAQPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms"   element={<TermsPage />} />
              <Route path="/articles"      element={<ArticlesPage />} />
              <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            </Route>

            {/* Protected customer routes — requires login */}
            <Route element={<ProtectedRoute />}>
              <Route element={<CustomerLayout />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<DashboardPage />} />
                <Route path="/admin/products" element={<ProductsAdminPage />} />
                <Route path="/admin/categories" element={<CategoriesAdminPage />} />
                <Route path="/admin/orders" element={<OrdersAdminPage />} />
                <Route path="/admin/orders/:id" element={<OrderDetailsAdminPage />} />
                <Route path="/admin/users" element={<UsersAdminPage />} />
                <Route path="/admin/payments" element={<PaymentsAdminPage />} />
                <Route path="/admin/chat" element={<ChatAdminPage />} />
                <Route path="/admin/reviews" element={<ReviewsAdminPage />} />
                <Route path="/admin/articles" element={<ArticlesAdminPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}