import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Send, Zap, Loader2, MessageSquare } from "lucide-react";
import type { Conversation, Message } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const conversationId = params?.id ? parseInt(params.id) : null;

  async function handleNewChat(initialMessage?: string) {
    const res = await apiRequest("POST", "/api/conversations", { title: "New Chat" });
    const conv = await res.json();
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    setLocation(`/chat/${conv.id}${initialMessage ? `?prompt=${encodeURIComponent(initialMessage)}` : ""}`);
  }

  if (!conversationId) {
    return <ChatEmpty onNewChat={handleNewChat} />;
  }

  return <ChatConversation conversationId={conversationId} />;
}

function ChatEmpty({ onNewChat }: { onNewChat: (msg?: string) => void }) {
  const prompts = [
    "Help me analyze my latest video script",
    "What makes content go viral?",
    "Review my video performance data",
    "Build my Virality DNA profile",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
        <Zap className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">ScriptLabs AI</h2>
      <p className="text-muted-foreground max-w-md mb-6 text-sm leading-relaxed">
        Your personal content strategy coach. I can help you analyze scripts,
        review video performance, build your Virality DNA, and craft content
        that resonates with your audience.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full mb-6">
        {prompts.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onNewChat(text)}
            className="text-left p-3 rounded-md border text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 transition-colors cursor-pointer"
            data-testid={`button-prompt-${text.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`}
          >
            {text}
          </button>
        ))}
      </div>
      <Button onClick={() => onNewChat()} data-testid="button-start-new-chat">
        <MessageSquare className="w-4 h-4 mr-1" />
        Start New Conversation
      </Button>
    </div>
  );
}

const WELCOME_MESSAGE = `Hey! I'm ScriptBot, your AI content strategist. I'm here to help you brainstorm video ideas, write scripts, analyze what's working, and build your unique style.\n\nWhat can I help you with today?`;

function ChatConversation({ conversationId }: { conversationId: number }) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptSentRef = useRef(false);

  const { data: conversation, isLoading } = useQuery<Conversation & { messages: Message[] }>({
    queryKey: ["/api/conversations", conversationId],
  });

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (promptSentRef.current || isLoading || !conversation) return;
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt");
    if (prompt && conversation.messages.length === 0) {
      promptSentRef.current = true;
      setInput(prompt);
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => {
        sendMessageDirect(prompt);
      }, 100);
    }
  }, [isLoading, conversation]);

  const sendMessageDirect = async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    await doSendMessage(messageText.trim());
  };

  const doSendMessage = async (userMessage: string) => {
    queryClient.setQueryData(
      ["/api/conversations", conversationId],
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...(old.messages || []),
            { id: Date.now(), conversationId, role: "user", content: userMessage, createdAt: new Date().toISOString() },
          ],
        };
      }
    );

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: userMessage }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                setStreamingContent(fullResponse);
              }
              if (data.done) {
                setStreamingContent("");
                setIsStreaming(false);
                queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
                queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
              }
            } catch {
              // incomplete JSON, will be completed in next chunk
            }
          }
        }
      }
    } catch {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    await doSendMessage(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const initials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  if (isLoading) return <ChatSkeleton />;

  const allMessages = conversation?.messages || [];
  const showWelcome = allMessages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-3 border-b shrink-0">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium truncate" data-testid="text-conversation-title">
          {conversation?.title || "Chat"}
        </h2>
      </div>

      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {showWelcome && (
            <MessageBubble
              role="assistant"
              content={WELCOME_MESSAGE}
              userInitials=""
            />
          )}
          {allMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              userInitials={initials}
            />
          ))}
          {isStreaming && streamingContent && (
            <MessageBubble
              role="assistant"
              content={streamingContent}
              userInitials={initials}
              isStreaming
            />
          )}
          {isStreaming && !streamingContent && (
            <div className="flex items-start gap-3">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Zap className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about scripts, video strategy, performance analysis..."
            className="resize-none min-h-[44px] max-h-[200px]"
            rows={1}
            disabled={isStreaming}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  userInitials,
  isStreaming,
}: {
  role: string;
  content: string;
  userInitials: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`} data-testid={`message-${role}`}>
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback className={`text-xs ${isUser ? "bg-muted" : "bg-primary/10 text-primary"}`}>
          {isUser ? userInitials : <Zap className="w-3.5 h-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={`rounded-md px-4 py-2.5 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border"
        }`}
      >
        {content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className={`h-16 ${i % 2 === 0 ? "w-3/4" : "w-1/2"} rounded-md`} />
          </div>
        ))}
      </div>
    </div>
  );
}
