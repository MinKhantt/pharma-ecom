import api from "./axios";
import type { Article, ArticleListResponse} from "@/types";

export const articlesApi = {
  getArticles: (params?: { category?: string; skip?: number; limit?: number }) =>
    api.get<ArticleListResponse>("/articles", { params }).then((r) => r.data),

  getArticle: (slug: string) =>
    api.get<Article>(`/articles/${slug}`).then((r) => r.data),

  // Admin
  adminGetArticles: (params?: { category?: string; skip?: number; limit?: number }) =>
    api.get<ArticleListResponse>("/articles/admin/all", { params }).then((r) => r.data),

  createArticle: (data: {
    title: string;
    content: string;
    excerpt?: string;
    category: string;
    is_published: boolean;
  }) => api.post<Article>("/articles", data).then((r) => r.data),

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Article>(`/articles/${id}/cover`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  updateArticle: (id: string, data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    category: string;
    is_published: boolean;
  }>) => api.patch<Article>(`/articles/${id}`, data).then((r) => r.data),

  deleteArticle: (id: string) =>
    api.delete(`/articles/${id}`),
};