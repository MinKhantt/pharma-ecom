import { create } from "zustand";
import type { Message, WSMessage } from "@/types";

interface ChatState {
  socket: WebSocket | null;
  adminSocket: WebSocket | null;
  messages: Record<string, Message[]>;
  unreadCount: Record<string, number>;
  isConnected: boolean;

  setSocket: (socket: WebSocket | null) => void;
  setAdminSocket: (socket: WebSocket | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  handleWSMessage: (data: WSMessage) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setConnected: (connected: boolean) => void;
  disconnect: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  socket: null,
  adminSocket: null,
  messages: {},
  unreadCount: {},
  isConnected: false,

  setSocket: (socket) => set({ socket }),
  setAdminSocket: (adminSocket) => set({ adminSocket }),
  setConnected: (isConnected) => set({ isConnected }),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] ?? []),
          message,
        ],
      },
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  handleWSMessage: (data) => {
    if (data.event === "new_message" || data.event === "new_conversation") {
      if (data.conversation_id && data.message_id && data.content && data.sender_id && data.created_at) {
        const message: Message = {
          id: data.message_id,
          content: data.content,
          is_read: data.is_read ?? false,
          created_at: data.created_at,
          updated_at: data.created_at,
          sender_id: data.sender_id,
          conversation_id: data.conversation_id,
        };
        get().addMessage(data.conversation_id, message);
        get().incrementUnread(data.conversation_id);
      }
    }
  },

  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCount: {
        ...state.unreadCount,
        [conversationId]: (state.unreadCount[conversationId] ?? 0) + 1,
      },
    })),

  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCount: { ...state.unreadCount, [conversationId]: 0 },
    })),

  disconnect: () => {
    const { socket, adminSocket } = get();
    socket?.close();
    adminSocket?.close();
    set({ socket: null, adminSocket: null, isConnected: false });
  },
}));
