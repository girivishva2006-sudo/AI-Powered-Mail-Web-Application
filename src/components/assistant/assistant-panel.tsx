/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Mail, Search, FileText, MessageSquare, ArrowRight } from "lucide-react";

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  status: "completed" | "error";
  result?: any;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export function AssistantPanel() {
  const { dispatch } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "**Welcome to AI Mail Assistant!**\n\nI can help you with:\n\n**Search & Filter:**\n- \"Show unread emails\"\n- \"Find emails from Sarah\"\n- \"Search about project\"\n\n**Open & Navigate:**\n- \"Open email from David\"\n- \"Go to sent folder\"\n\n**Compose:**\n- \"Send email to john@example.com\"\n- \"Reply saying I'll be there\"",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processStateChanges = (stateChanges: any[]) => {
    stateChanges.forEach((change) => {
      if (change.type === "SET_VIEW") {
        dispatch({ type: "SET_VIEW", payload: change.payload });
      } else if (change.type === "SET_FILTERS") {
        dispatch({ type: "SET_FILTERS", payload: change.payload });
      } else if (change.type === "OPEN_EMAIL") {
        dispatch({ type: "OPEN_EMAIL", payload: change.payload });
      } else if (change.type === "UPDATE_COMPOSE") {
        dispatch({ type: "UPDATE_COMPOSE", payload: change.payload });
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      if (data.stateChanges && data.stateChanges.length > 0) {
        processStateChanges(data.stateChanges);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        toolCalls: data.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "search_emails": return <Search className="h-3 w-3" />;
      case "navigate_to_view": return <ArrowRight className="h-3 w-3" />;
      case "open_email": return <Mail className="h-3 w-3" />;
      case "open_compose": case "open_reply": return <FileText className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="mt-2 space-y-1">
                {msg.toolCalls.map((tc) => (
                  <div key={tc.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {getToolIcon(tc.name)}
                    </span>
                    <span>{tc.name.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input placeholder="Ask about emails..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} disabled={isLoading} />
          <Button size="icon" onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          AI assistant for email management
        </p>
      </div>
    </div>
  );
}
