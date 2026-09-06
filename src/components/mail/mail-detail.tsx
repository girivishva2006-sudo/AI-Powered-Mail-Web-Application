"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { EmailMessage } from "@/types/mail";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Reply, Forward, Star, Trash2, Mail, Loader2 } from "lucide-react";

interface MailDetailProps {
  email: EmailMessage;
}

export function MailDetail({ email }: MailDetailProps) {
  const { dispatch } = useApp();
  const [isStarred, setIsStarred] = useState(email.isStarred);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleStar = async () => {
    try {
      await fetch(`/api/mail/${email.id}/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ star: !isStarred }),
      });
      setIsStarred(!isStarred);
    } catch (error) {
      console.error("Star failed:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Move this email to trash?")) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/mail/${email.id}/delete`, {
        method: "POST",
      });
      dispatch({ type: "SET_VIEW", payload: "inbox" });
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
    }
  };

  const handleReply = () => {
    dispatch({
      type: "UPDATE_COMPOSE",
      payload: {
        to: email.from.email,
        subject: `Re: ${email.subject}`,
        body: "",
        replyToId: email.id,
      },
    });
    dispatch({ type: "SET_VIEW", payload: "compose" });
  };

  const handleForward = () => {
    dispatch({
      type: "UPDATE_COMPOSE",
      payload: {
        to: "",
        subject: `Fwd: ${email.subject}`,
        body: `\n\n---------- Forwarded message ----------\nFrom: ${email.from.name} <${email.from.email}>\nDate: ${formatDate(email.date)}\nSubject: ${email.subject}\n\n${email.body}`,
        forwardId: email.id,
      },
    });
    dispatch({ type: "SET_VIEW", payload: "compose" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: "SET_VIEW", payload: "inbox" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleReply}>
          <Reply className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleForward}>
          <Forward className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleStar}>
          <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold mb-4">{email.subject}</h1>

          <div className="flex items-start gap-3 mb-6">
            <Avatar fallback={email.from.name || email.from.email} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {email.from.name || email.from.email}
                </span>
                <span className="text-sm text-muted-foreground">
                  &lt;{email.from.email}&gt;
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                To: {email.to.map((t) => t.email).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(email.date)}
              </p>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="prose prose-sm max-w-none dark:prose-invert">
            {email.bodyHtml ? (
              <div dangerouslySetInnerHTML={{ __html: email.bodyHtml }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {email.body || email.snippet}
              </pre>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
