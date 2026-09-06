"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { EmailMessage } from "@/types/mail";
import { Avatar } from "@/components/ui/avatar";
import { Star, Inbox } from "lucide-react";

interface MailListProps {
  emails: EmailMessage[];
  onOpenEmail: (emailId: string) => void;
}

export function MailList({ emails, onOpenEmail }: MailListProps) {
  const { state } = useApp();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No emails</p>
        <p className="text-sm">No messages to display</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => onOpenEmail(email.id)}
          className={cn(
            "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50",
            !email.isRead && "bg-accent/20",
            state.currentEmailId === email.id && "bg-accent"
          )}
        >
          <Avatar fallback={email.from.name || email.from.email} size="md" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-sm truncate",
                  !email.isRead ? "font-semibold" : "font-medium"
                )}
              >
                {email.from.name || email.from.email}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(email.date)}
              </span>
            </div>

            <p
              className={cn(
                "text-sm truncate mt-0.5",
                !email.isRead ? "font-medium" : "text-muted-foreground"
              )}
            >
              {email.subject}
            </p>

            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {email.snippet}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            {email.isStarred && (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            )}
            {!email.isRead && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
