import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { chatApi } from "@/api/chat";
import { useAuthStore } from "@/store/authStore";
import { WS_BASE_URL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import type { Message, WSMessage } from "@/types";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["my-conversations"],
    queryFn: chatApi.getMyConversations,
  });

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      setConversationId(conversations[0].id);
    }
  }, [conversations]);

  const { data: initialMessages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatApi.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!conversationId || !accessToken) return;
    const ws = new WebSocket(
      `${WS_BASE_URL}/chat/ws/conversations/${conversationId}?token=${accessToken}`
    );
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const data: WSMessage = JSON.parse(e.data);
      if (data.event === "new_message" && data.message_id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message_id)) return prev;
          return [
            ...prev,
            {
              id: data.message_id!,
              content: data.content!,
              sender_id: data.sender_id!,
              conversation_id: conversationId,
              is_read: false,
              created_at: data.created_at ?? new Date().toISOString(),
              updated_at: data.created_at ?? new Date().toISOString(),
            },
          ];
        });
      }
    };

    return () => ws.close();
  }, [conversationId, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: startConversation, isPending: isStarting } = useMutation({
    mutationFn: (message: string) => chatApi.startConversation(message),
    onSuccess: (conv) => {
      setConversationId(conv.id);
      setMessages(conv.messages);
      queryClient.invalidateQueries({ queryKey: ["my-conversations"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to start chat"),
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage(conversationId!, content),
    onSuccess: (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail ?? "Failed to send"),
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    if (!conversationId) {
      startConversation(content);
    } else {
      sendMessage(content);
    }
  };

  // Customer initials for fallback
  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  if (isLoading) return <LoadingSpinner className="py-16" />;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              SLM
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">Pharmacy Support</p>
            <p className="text-xs text-muted-foreground">
              Ask about prescriptions, medicines, and more
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">Start a conversation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Type a message below to chat with our pharmacist
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* Pharmacist avatar + name */}
                    {!isMe && (
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <Avatar className="h-7 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            SLM
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          Pharmacy
                        </span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMe
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatDateTime(msg.created_at)}
                      </p>
                    </div>

                    {/* Customer avatar + "You" label */}
                    {isMe && (
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={user?.profile?.avatar_url ?? ""}
                            alt={user?.full_name ?? "You"}
                          />
                          <AvatarFallback className="text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground">
                          You
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              disabled={isSending || isStarting}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isSending || isStarting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}