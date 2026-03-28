import api from "./axios";
import type {
  Category,
  Product,
  ProductListResponse,
  CreateProductRequest,
} from "@/types";

export const productsApi = {
  // Categories
  getCategories: () =>
    api.get<Category[]>("/categories").then((r) => r.data),

  createCategory: (data: { name: string; description?: string }) =>
    api.post<Category>("/categories", data).then((r) => r.data),

  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) => api.delete(`/categories/${id}`),

  // Products
  getProducts: (params?: {
    skip?: number;
    limit?: number;
    category_id?: string;
    requires_prescription?: boolean;
    search?: string;
  }) =>
    api
      .get<ProductListResponse>("/products", { params })
      .then((r) => r.data),

  getProduct: (id: string) =>
    api.get<Product>(`/products/${id}`).then((r) => r.data),

  createProduct: (data: CreateProductRequest) =>
    api.post<Product>("/products", data).then((r) => r.data),

  updateProduct: (id: string, data: Partial<CreateProductRequest>) =>
    api.patch<Product>(`/products/${id}`, data).then((r) => r.data),

  deleteProduct: (id: string) => api.delete(`/products/${id}`),

  uploadImage: (productId: string, file: File, isPrimary = false) => {
    const form = new FormData();
    form.append("file", file);
    form.append("is_primary", String(isPrimary));
    return api
      .post<Product>(`/products/${productId}/images`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteImage: (productId: string, imageId: string) =>
    api.delete(`/products/${productId}/images/${imageId}`),
};
