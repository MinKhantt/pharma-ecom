import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { chatApi } from "@/api/chat";
import { useAuthStore } from "@/store/authStore";
import { WS_BASE_URL } from "@/lib/constants";
import { formatDateTime, cn } from "@/lib/utils";
import type { Message, WSMessage, Conversation, Member } from "@/types";

export default function ChatAdminPage() {
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Fetch all conversations for the sidebar
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: chatApi.adminGetConversations,
    refetchInterval: 10000, // Poll every 10s as a backup to WS
  });

  // 2. Fetch specific messages when a conversation is selected
  const { data: convDetail } = useQuery({
    queryKey: ["admin-conversation", selectedId],
    queryFn: () => chatApi.adminGetConversation(selectedId!),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (convDetail) setMessages(convDetail.messages);
  }, [convDetail]);

  // 3. Admin WebSocket Connection
  useEffect(() => {
    if (!accessToken) return;
    const ws = new WebSocket(`${WS_BASE_URL}/chat/ws/admin?token=${accessToken}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const data: WSMessage = JSON.parse(e.data);
      // Update message list if the message belongs to the current open chat
      if (data.event === "new_message" && data.conversation_id === selectedId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message_id)) return prev;
          return [...prev, {
            id: data.message_id!,
            content: data.content!,
            sender_id: data.sender_id!,
            conversation_id: data.conversation_id!,
            is_read: false,
            created_at: data.created_at ?? new Date().toISOString(),
            updated_at: data.created_at ?? new Date().toISOString(),
          }];
        });
      }
      // Refresh the sidebar list for any new activity
      if (data.event === "new_conversation" || data.event === "new_message") {
        queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
      }
    };

    return () => ws.close();
  }, [accessToken, selectedId, queryClient]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send Message Mutation
  const { mutate: reply, isPending: isReplying } = useMutation({
    mutationFn: (content: string) => chatApi.adminReply(selectedId!, content),
    onSuccess: (msg) => {
      setMessages((prev) => [...prev, msg]);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? "Failed to send"),
  });

  const handleSend = () => {
    if (!input.trim() || !selectedId) return;
    const content = input.trim();
    setInput("");
    reply(content);
  };

  // 5. DATA HELPERS
  // Filters the members to find the customer (the one who isn't the logged-in admin)
  const getCustomerMember = (conv: Conversation | any): Member | null => {
    if (!conv?.members) return null;
    return conv.members.find((m: Member) => m.user_id !== user?.id) || null;
  };

  // Extract variables for the Active Chat Header
  const activeConversation = conversations?.find((c) => c.id === selectedId);
  const customer = getCustomerMember(activeConversation);
  const activeName = customer?.user?.full_name || `Customer ${selectedId?.slice(0, 6)}`;
  const activeAvatar = customer?.user?.avatar_url || null;
  const activeInitials = (activeName || "C").substring(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex gap-4 h-[calc(100vh-7rem)]">
        {/* --- LEFT SIDEBAR: CONVERSATIONS LIST --- */}
        <Card className="w-80 shrink-0 flex flex-col overflow-hidden border-slate-200 shadow-sm">
          <div className="p-4 border-b border-border bg-slate-50/50 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold">Inboxes</span>
            {conversations && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 h-5 bg-slate-200">
                {conversations.length}
              </Badge>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex justify-center p-8"><LoadingSpinner size="sm" /></div>
            ) : conversations?.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations?.map((conv) => {
                  const sideCustomer = getCustomerMember(conv);
                  const name = sideCustomer?.user?.full_name || `Customer ${conv.id.slice(0, 6)}`;
                  const avatar = sideCustomer?.user?.avatar_url || null;
                  const isSelected = selectedId === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-200 group",
                        isSelected ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0 border-2 border-white shadow-sm">
                          <AvatarImage src={avatar || ""} alt={name} />
                          <AvatarFallback className={cn(
                            "text-xs font-bold",
                            isSelected ? "bg-primary-foreground/20 text-white" : "bg-slate-200 text-slate-600"
                          )}>
                            {name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold truncate">{name}</p>
                          </div>
                          <p className={cn(
                            "text-[11px] truncate mt-0.5 opacity-80",
                            isSelected ? "text-primary-foreground" : "text-slate-500"
                          )}>
                            {formatDateTime(conv.updated_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* --- RIGHT SIDE: CHAT PANEL --- */}
        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50/30">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <MessageCircle className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-slate-700">Select a conversation</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Pick a customer from the left to start messaging</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                    <AvatarImage src={activeAvatar || ""} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{activeInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{activeName}</p>
                    <div className="flex items-center gap-1.5">
                       <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[11px] text-slate-400 font-medium">Customer Support Thread</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <ScrollArea className="flex-1 p-6 bg-[#f8fafc]">
                <div className="space-y-6">
                  {messages.map((msg, i) => {
                    const isAdmin = msg.sender_id === user?.id;
                    const isFirstInGroup = !messages[i - 1] || messages[i - 1].sender_id !== msg.sender_id;

                    return (
                      <div key={msg.id} className={cn("flex gap-3", isAdmin ? "justify-end" : "justify-start")}>
                        {/* Customer Avatar in Chat */}
                        {!isAdmin && (
                          <div className="w-8 shrink-0">
                            {isFirstInGroup && (
                              <Avatar className="h-8 w-8 border border-white shadow-sm">
                                <AvatarImage src={activeAvatar || ""} />
                                <AvatarFallback className="text-[10px] bg-slate-200 font-bold">{activeInitials}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className={cn("flex flex-col max-w-[75%]", isAdmin ? "items-end" : "items-start")}>
                          <div className={cn(
                            "px-4 py-2.5 text-sm shadow-sm transition-all",
                            isAdmin 
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none" 
                              : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none"
                          )}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {isFirstInGroup && (
                            <span className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
                              {formatDateTime(msg.created_at)}
                            </span>
                          )}
                        </div>

                        {/* Admin Avatar in Chat */}
                        {isAdmin && (
                          <div className="w-8 shrink-0">
                            {isFirstInGroup && (
                              <Avatar className="h-8 w-8 border border-white shadow-sm">
                                <AvatarImage src={user?.profile?.avatar_url || ""} />
                                <AvatarFallback className="text-[10px] bg-emerald-500 text-white font-bold">AD</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Input Bar */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 focus-within:border-primary/50 transition-all">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Reply to ${activeName}...`}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={isReplying}
                    className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isReplying}
                    className="h-11 w-11 shrink-0 rounded-xl shadow-blue-200 shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}