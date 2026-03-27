import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import type { User } from "@/types";
import { API_BASE_URL } from "@/lib/constants";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return; // ← prevent double run
    hasRun.current = true;
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const isProfileComplete = searchParams.get("is_profile_complete") === "true";
    const error = searchParams.get("error");

    if (error) {
      toast.error("Google login failed. Please try again.");
      navigate("/login");
      return;
    }

    if (!accessToken || !refreshToken) {
      toast.error("Invalid callback. Please try again.");
      navigate("/login");
      return;
    }

    const finishLogin = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const user: User = await response.json();
        setAuth(user, accessToken, refreshToken);
        toast.success(`Welcome, ${user.full_name.split(" ")[0]}!`);

        if (!isProfileComplete) {
          navigate("/complete-profile");
        } else if (user.is_superuser) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Google callback error:", err);
        toast.error("Failed to load user. Please login again.");
        navigate("/login");
      }
    };

    finishLogin();
  }, [searchParams]);

  return <PageLoader />;
}