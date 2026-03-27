import api from "./axios";
import type { AIChatMessage, AIChatResponse } from "@/types";

export const aiChatApi = {
  sendMessage: (message: string) =>
    api.post<AIChatResponse>("/ai-chat", { message }).then((r) => r.data),

  getHistory: () =>
    api.get<AIChatMessage[]>("/ai-chat/history").then((r) => r.data),

  clearHistory: () => api.delete("/ai-chat/history"),
};
