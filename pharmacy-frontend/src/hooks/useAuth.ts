import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import type { LoginRequest, RegisterRequest } from "@/types";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      if (!data.is_profile_complete) {
        navigate("/complete-profile");
      } else if (data.user.is_superuser) {
        navigate("/admin");
      } else {
        navigate("/");
      }
      toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}!`);
    },
    onError: () => {
      toast.error("Invalid email or password");
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      navigate("/complete-profile");
      toast.success("Account created! Please complete your profile.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail ?? "Registration failed";
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const { disconnect } = useChatStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      disconnect();
      queryClient.clear();
      navigate("/login");
      toast.success("Logged out successfully");
    },
  });
}

export function useMe() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => usersApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
