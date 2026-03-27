import api from "./axios";
import type { Order, OrderListResponse, CheckoutRequest, OrderStatus } from "@/types";

export const ordersApi = {
  checkout: (data: CheckoutRequest) =>
    api.post<Order>("/orders", data).then((r) => r.data),

  getMyOrders: (params?: { skip?: number; limit?: number; order_status?: OrderStatus }) =>
    api.get<OrderListResponse>("/orders/me", { params }).then((r) => r.data),

  getMyOrder: (id: string) =>
    api.get<Order>(`/orders/me/${id}`).then((r) => r.data),

  cancelOrder: (id: string) =>
    api.patch<Order>(`/orders/me/${id}/cancel`).then((r) => r.data),

  uploadPrescription: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<Order>(`/orders/me/${id}/prescription`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  requestReturn: (id: string, data: { reason: string; note?: string }) =>
  api.post<Order>(`/orders/me/${id}/return`, data).then((r) => r.data),

  // Admin
  getAllOrders: (params?: { skip?: number; limit?: number; status?: OrderStatus }) =>
    api.get<OrderListResponse>("/orders", { params }).then((r) => r.data),

  getOrderById: (id: string) =>
    api.get<Order>(`/orders/${id}`).then((r) => r.data),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    api.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),

  handleReturn: (id: string, approve: boolean) =>
  api.patch<Order>(`/orders/${id}/return`, { approve }).then((r) => r.data),
};
