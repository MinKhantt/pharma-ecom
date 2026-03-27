import api from "./axios";
import type { Payment, CreatePaymentRequest } from "@/types";

export const paymentsApi = {
  createPayment: (data: CreatePaymentRequest) =>
    api.post<Payment>("/payments", data).then((r) => r.data),

  getMyPayment: (orderId: string) =>
    api.get<Payment>(`/payments/orders/${orderId}`).then((r) => r.data),

  refundPayment: (orderId: string) =>
    api.post<Payment>(`/payments/orders/${orderId}/refund`).then((r) => r.data),

  // Admin
  getPayment: (paymentId: string) =>
    api.get<Payment>(`/payments/${paymentId}`).then((r) => r.data),

  getPaymentByOrder: (orderId: string) =>
    api.get<Payment>(`/payments/orders/${orderId}/admin`).then((r) => r.data),
};
