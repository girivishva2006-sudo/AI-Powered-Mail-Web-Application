"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, X, Check } from "lucide-react";
import { demoStore } from "@/lib/demo-store";

export function ComposeForm() {
  const { state, dispatch } = useApp();
  const { composeState } = state;
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!composeState.to || !composeState.subject) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeState.to,
          subject: composeState.subject,
          body: composeState.body,
          replyToId: composeState.replyToId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      dispatch({ type: "RESET_COMPOSE" });
      dispatch({ type: "SET_VIEW", payload: "sent" });
    } catch {
      demoStore.sendEmail(composeState.to, composeState.subject, composeState.body);
      setSent(true);
      setTimeout(() => {
        dispatch({ type: "RESET_COMPOSE" });
        dispatch({ type: "SET_VIEW", payload: "sent" });
      }, 1500);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    dispatch({ type: "RESET_COMPOSE" });
    dispatch({ type: "SET_VIEW", payload: "inbox" });
  };

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">Email Sent!</h2>
          <p className="text-muted-foreground">Your message has been sent successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold">New Message</h2>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-16">To</label>
            <Input
              placeholder="recipient@example.com"
              value={composeState.to}
              onChange={(e) =>
                dispatch({ type: "UPDATE_COMPOSE", payload: { to: e.target.value } })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium w-16">Subject</label>
            <Input
              placeholder="Email subject"
              value={composeState.subject}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_COMPOSE",
                  payload: { subject: e.target.value },
                })
              }
            />
          </div>

          <Textarea
            placeholder="Write your email..."
            className="min-h-[400px] resize-none"
            value={composeState.body}
            onChange={(e) =>
              dispatch({ type: "UPDATE_COMPOSE", payload: { body: e.target.value } })
            }
          />
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Button onClick={handleSend} disabled={!composeState.to || !composeState.subject || isSending}>
          <Send className="h-4 w-4 mr-2" />
          {isSending ? "Sending..." : "Send"}
        </Button>
        <Button variant="ghost" onClick={handleCancel}>
          Discard
        </Button>
      </div>
    </div>
  );
}
