import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { aiChatApi } from "@/api/aiChat";
import { formatDateTime } from "@/lib/utils";
import type { AIChatMessage } from "@/types";

export default function AIChatPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<AIChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["ai-chat-history"],
    queryFn: aiChatApi.getHistory,
  });

  useEffect(() => {
    if (history) setLocalMessages(history);
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: aiChatApi.sendMessage,
    onMutate: (message) => {
      const userMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
    },
    onSuccess: (data) => {
      setLocalMessages(data.history);
      setIsTyping(false);
    },
    onError: (err: any) => {
      setIsTyping(false);
      toast.error(err.response?.data?.detail ?? "AI service unavailable");
    },
  });

  const { mutate: clearHistory, isPending: isClearing } = useMutation({
    mutationFn: aiChatApi.clearHistory,
    onSuccess: () => {
      setLocalMessages([]);
      queryClient.invalidateQueries({ queryKey: ["ai-chat-history"] });
      toast.success("Chat history cleared");
    },
  });

  const handleSend = () => {
    if (!input.trim() || isPending) return;
    const message = input.trim();
    setInput("");
    sendMessage(message);
  };

  if (isLoading) return <LoadingSpinner className="py-16" />;

  return (
    <div className="space-y-6">


      <Card className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border shrink-0 bg-primary/5">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">ShweLaMinBot</p>
            <p className="text-xs text-muted-foreground">AI-powered pharmacy assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        {localMessages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearHistory()}
            disabled={isClearing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear history
          </Button>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Hello! I'm ShweLaMinBot</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                I can help you with questions about medicines, dosages, side effects, and product recommendations.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                {[
                  "What's the dosage for paracetamol?",
                  "Do you have antibiotics?",
                  "What medicines help with headaches?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="text-left text-sm px-4 py-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {localMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            AI responses are for informational purposes only. Always consult a licensed pharmacist for medical advice.
          </p>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about medicines, dosages, side effects..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
