import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

// Only requires login — for cart, checkout, orders, chat, profile
export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_profile_complete) return <Navigate to="/complete-profile" replace />;
  if (user?.is_superuser) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

// Admin only
export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_superuser) return <Navigate to="/" replace />;
  return <Outlet />;
}

// Guest only — redirect logged in users away from auth pages
export function GuestRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Outlet />;
  if (!user?.is_profile_complete) return <Navigate to="/complete-profile" replace />;
  if (user?.is_superuser) return <Navigate to="/admin" replace />;
  return <Navigate to="/" replace />;
}

// Public route — accessible by anyone, but shows different UI if logged in
export function PublicRoute() {
  return <Outlet />;
}