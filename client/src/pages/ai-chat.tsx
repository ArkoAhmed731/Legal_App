import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Plus,
  MessageSquare,
  AlertTriangle,
  Calendar,
  FileText,
  Trash2,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { APP_CONFIG } from "@/lib/app-config";
interface AiConversation {
  id: number;
  userId: string;
  title: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface AiMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  refusalFlag: boolean | null;
  escalationType: string | null;
  createdAt: string | null;
}
import { TenantLink } from "@/components/tenant-link";

export default function AiChatPage() {
  const { user } = useAuth();
  const WelcomeIcon = APP_CONFIG.icon;
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useQuery<AiConversation[]>({
    queryKey: ["/api/ai/conversations"],
  });

  const { data: conversationMessages, isLoading: loadingMsgs } = useQuery<AiMessage[]>({
    queryKey: ["/api/ai/conversations", selectedConvId, "messages"],
    enabled: !!selectedConvId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/conversations", { title: "New Conversation" });
      return res.json();
    },
    onSuccess: (data: AiConversation) => {
      setSelectedConvId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ai/conversations/${id}`);
    },
    onSuccess: () => {
      if (selectedConvId) setSelectedConvId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
    },
  });

  const sendMessage = async () => {
    if (!input.trim() || !selectedConvId || isStreaming) return;

    const message = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const response = await fetch(`/api/ai/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullResponse += data.content;
              setStreamingMessage(fullResponse);
            }
            if (data.done) {
              setIsStreaming(false);
              setStreamingMessage("");
              queryClient.invalidateQueries({
                queryKey: ["/api/ai/conversations", selectedConvId, "messages"],
              });
            }
            if (data.escalation) {
              // handled in render
            }
          } catch (e) {}
        }
      }
    } catch (error) {
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages, streamingMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const allMessages = conversationMessages || [];

  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-muted/30 flex flex-col shrink-0 hidden md:flex">
        <div className="p-3 border-b">
          <Button
            onClick={() => createConversation.mutate()}
            className="w-full"
            size="sm"
            disabled={createConversation.isPending}
            data-testid="button-new-chat"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingConvs ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : conversations?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No conversations yet
              </p>
            ) : (
              conversations?.map((conv) => (
                <div key={conv.id} className="group flex items-center gap-1">
                  <Button
                    variant={selectedConvId === conv.id ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 justify-start text-left truncate"
                    onClick={() => setSelectedConvId(conv.id)}
                    data-testid={`button-conversation-${conv.id}`}
                  >
                    <MessageSquare className="h-3 w-3 mr-2 shrink-0" />
                    <span className="truncate text-xs">{conv.title}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7 invisible group-hover:visible"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation.mutate(conv.id);
                    }}
                    data-testid={`button-delete-conversation-${conv.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {!selectedConvId ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-6 max-w-md">
              <div className="mx-auto h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <WelcomeIcon className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold" data-testid="text-ai-welcome">
                  {APP_CONFIG.aiWelcomeTitle}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {APP_CONFIG.aiWelcomeDescription}
                </p>
              </div>
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground text-left">
                    {APP_CONFIG.aiDisclaimerText}
                  </p>
                </CardContent>
              </Card>
              <Button
                onClick={() => createConversation.mutate()}
                disabled={createConversation.isPending}
                data-testid="button-start-conversation"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start a Conversation
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate" data-testid="text-conversation-title">
                  {conversations?.find((c) => c.id === selectedConvId)?.title || "Conversation"}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {APP_CONFIG.aiBadgeLabel}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {loadingMsgs ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-3/4" />)}
                </div>
              ) : allMessages.length === 0 && !streamingMessage ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Start by typing a question to get started.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {APP_CONFIG.aiSuggestions.map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(q);
                          textareaRef.current?.focus();
                        }}
                        data-testid={`button-suggestion-${q.slice(0, 10)}`}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {allMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-md p-3 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.escalationType && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-foreground/10">
                            {msg.escalationType === "BOOK_LAWYER" && (
                              <TenantLink href="/lawyers">
                                <Button size="sm" variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Book a Lawyer
                                </Button>
                              </TenantLink>
                            )}
                            {msg.escalationType === "DOC_GEN" && (
                              <TenantLink href="/documents">
                                <Button size="sm" variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Generate Document
                                </Button>
                              </TenantLink>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {streamingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-md p-3 text-sm bg-muted">
                        <div className="whitespace-pre-wrap">{streamingMessage}</div>
                      </div>
                    </div>
                  )}
                  {isStreaming && !streamingMessage && (
                    <div className="flex justify-start">
                      <div className="rounded-md p-3 bg-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={APP_CONFIG.aiPlaceholder}
                  className="resize-none min-h-[44px] max-h-[120px] text-sm"
                  rows={1}
                  disabled={isStreaming}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {APP_CONFIG.aiFooterNote}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
