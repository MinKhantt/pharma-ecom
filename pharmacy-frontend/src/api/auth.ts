import api from "./axios";
import type { LoginRequest, RegisterRequest, TokenResponse } from "@/types";

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<TokenResponse>("/auth/register", data).then((r) => r.data),

  logout: () => api.post("/auth/logout"),

  refresh: (refresh_token: string) =>
    api
      .post<{ access_token: string; refresh_token: string }>("/auth/refresh", {
        refresh_token,
      })
      .then((r) => r.data),

  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"}/auth/google`;
  },
};
