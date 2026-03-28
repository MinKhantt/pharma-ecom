import api from "./axios";
import type { Conversation, ConversationSummary, Message } from "@/types";

export const chatApi = {
  startConversation: (message: string) =>
    api
      .post<Conversation>("/chat/conversations", { message })
      .then((r) => r.data),

  getMyConversations: () =>
    api
      .get<ConversationSummary[]>("/chat/conversations")
      .then((r) => r.data),

  getConversation: (id: string) =>
    api.get<Conversation>(`/chat/conversations/${id}`).then((r) => r.data),

  getMessages: (id: string, skip = 0, limit = 50) =>
    api
      .get<Message[]>(`/chat/conversations/${id}/messages`, {
        params: { skip, limit },
      })
      .then((r) => r.data),

  sendMessage: (id: string, content: string) =>
    api
      .post<Message>(`/chat/conversations/${id}/messages`, { content })
      .then((r) => r.data),

  markRead: (id: string) =>
    api.post(`/chat/conversations/${id}/read`),

  // Admin
  adminGetConversations: () =>
    api
      .get<ConversationSummary[]>("/chat/admin/conversations")
      .then((r) => r.data),

  adminGetConversation: (id: string) =>
    api
      .get<Conversation>(`/chat/admin/conversations/${id}`)
      .then((r) => r.data),

  adminReply: (id: string, content: string) =>
    api
      .post<Message>(`/chat/admin/conversations/${id}/messages`, { content })
      .then((r) => r.data),

  adminMarkRead: (id: string) =>
    api.post(`/chat/admin/conversations/${id}/read`),
};
