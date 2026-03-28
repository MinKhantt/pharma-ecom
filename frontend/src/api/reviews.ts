import api from "./axios";
import type {
  Review,
  ReviewListResponse
} from "@/types";

export const reviewsApi = {
  getPublicReviews: (params?: { skip?: number; limit?: number }) =>
    api.get<ReviewListResponse>("/reviews", { params }).then((r) => r.data),

  getMyReview: () =>
    api.get<Review | null>("/reviews/me").then((r) => r.data),

  createReview: (data: { rating: number; comment: string }) =>
    api.post<Review>("/reviews", data).then((r) => r.data),

  // Admin
  getAllReviews: (params?: { skip?: number; limit?: number }) =>
    api.get<ReviewListResponse>("/reviews/admin", { params }).then((r) => r.data),

  approveReview: (id: string) =>
    api.patch<Review>(`/reviews/${id}/approve`).then((r) => r.data),

  deleteReview: (id: string) =>
    api.delete(`/reviews/${id}`),
};