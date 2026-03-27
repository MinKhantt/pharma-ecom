import api from "./axios";
import type {
  User,
  CompleteProfileRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/types";

export const usersApi = {
  getMe: () => api.get<User>("/users/me").then((r) => r.data),

  completeProfile: (data: CompleteProfileRequest) =>
    api.post<User>("/users/me/profile", data).then((r) => r.data),

  updateMe: (data: UpdateUserRequest) =>
    api.patch<User>("/users/me", data).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<User>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  changePassword: (data: ChangePasswordRequest) =>
    api.patch("/users/me/password", data),

  // Admin
  getAllUsers: (skip = 0, limit = 20) =>
    api.get<User[]>(`/users/?skip=${skip}&limit=${limit}`).then((r) => r.data),

  getUserById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  deleteUser: (id: string) => api.delete(`/users/${id}`),

  updateUser: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
};
