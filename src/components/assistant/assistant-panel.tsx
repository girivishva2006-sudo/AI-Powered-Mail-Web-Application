"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { AssistantMessage } from "@/types/app";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Bot, Loader2, Wrench } from "lucide-react";

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export function AssistantPanel() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.assistantMessages]);

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: AssistantMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: userMessage });
    setInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          context: {
            currentView: state.currentView,
            currentEmailId: state.currentEmailId,
            searchQuery: state.searchQuery,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: AssistantMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.message,
        toolCalls: data.toolCalls,
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: assistantMessage });

      if (data.stateChanges) {
        data.stateChanges.forEach((change: { type: string; payload: unknown }) => {
          dispatch(change as Parameters<typeof dispatch>[0]);
        });
      }
    } catch (error) {
      const errorMessage: AssistantMessage = {
        id: `msg-${Date.now()}-error`,
        role: "system",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderToolCall = (toolCall: AssistantMessage["toolCalls"]) => {
    if (!toolCall) return null;
    return toolCall.map((tc) => (
      <div
        key={tc.id}
        className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded px-2 py-1 mt-1"
      >
        <Wrench className="h-3 w-3" />
        <span>{tc.name}</span>
        <span className="text-green-500">
          {tc.status === "completed" ? "✓" : tc.status === "running" ? "..." : tc.status === "error" ? "✗" : "○"}
        </span>
      </div>
    ));
  };

  if (!state.isAssistantOpen) {
    return null;
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">AI Assistant</span>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {state.assistantMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">How can I help you?</p>
              <p className="text-xs mt-1">
                Try: &quot;Show me unread emails from this week&quot;
              </p>
            </div>
          )}

          {state.assistantMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar
                fallback={msg.role === "user" ? "U" : "AI"}
                size="sm"
                className={msg.role === "assistant" ? "bg-primary" : ""}
              />
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{msg.role === "system" ? "System" : msg.role}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
                {msg.toolCalls && renderToolCall(msg.toolCalls)}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3">
              <Avatar fallback="AI" size="sm" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isProcessing}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
