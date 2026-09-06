/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useCallback, useRef } from "react";
import { useApp } from "@/lib/app-context";
import { MailList } from "./mail-list";
import { MailDetail } from "./mail-detail";
import { ComposeForm } from "./compose-form";
import { EmailMessage } from "@/types/mail";
import { demoStore } from "@/lib/demo-store";

const emailCache = new Map<string, { data: EmailMessage[]; timestamp: number }>();
const CACHE_TTL = 30000;

export function MailPage() {
  const { state, dispatch } = useApp();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const currentFolder = useRef("inbox");
  const isDemoMode = useRef(false);
  const [mounted, setMounted] = useState(false);

  const fetchEmails = useCallback(async (folder: string = "inbox", force: boolean = false) => {
    const cacheKey = folder;
    const cached = emailCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setEmails(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ folder });
      const response = await fetch(`/api/mail?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const msgs = data.messages || [];
        setEmails(msgs);
        emailCache.set(cacheKey, { data: msgs, timestamp: Date.now() });
        isDemoMode.current = false;
      } else {
        throw new Error("API failed");
      }
    } catch {
      isDemoMode.current = true;
      const mockEmails = demoStore.getFolder(folder);
      setEmails(mockEmails);
      emailCache.set(cacheKey, { data: mockEmails, timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  }, []);

  const openEmail = useCallback(async (emailId: string) => {
    setLoadingEmail(true);
    try {
      if (isDemoMode.current) {
        const email = demoStore.getEmail(emailId);
        if (email) {
          demoStore.markAsRead(emailId);
          setSelectedEmail({ ...email, isRead: true });
          dispatch({ type: "OPEN_EMAIL", payload: emailId });
          setEmails((prev) =>
            prev.map((e) => (e.id === emailId ? { ...e, isRead: true } : e))
          );
        }
      } else {
        const response = await fetch(`/api/mail/${emailId}`);
        if (response.ok) {
          const fullEmail = await response.json();
          setSelectedEmail(fullEmail);
          dispatch({ type: "OPEN_EMAIL", payload: emailId });
          setEmails((prev) =>
            prev.map((e) => (e.id === emailId ? { ...e, isRead: true } : e))
          );
        }
      }
    } catch {
      const email = demoStore.getEmail(emailId);
      if (email) {
        demoStore.markAsRead(emailId);
        setSelectedEmail({ ...email, isRead: true });
        dispatch({ type: "OPEN_EMAIL", payload: emailId });
      }
    } finally {
      setLoadingEmail(false);
    }
  }, [dispatch]);

  React.useLayoutEffect(() => {
    setMounted(true);
    fetchEmails("inbox");
  }, [fetchEmails]);

  React.useLayoutEffect(() => {
    if (state.currentView !== "email-detail") {
      setSelectedEmail(null);
    }

    if (state.currentView === "inbox" && currentFolder.current !== "inbox") {
      currentFolder.current = "inbox";
      fetchEmails("inbox");
    } else if (state.currentView === "sent" && currentFolder.current !== "sent") {
      currentFolder.current = "sent";
      fetchEmails("sent");
    } else if (state.currentView === "starred" && currentFolder.current !== "starred") {
      currentFolder.current = "starred";
      fetchEmails("inbox");
    } else if (state.currentView === "drafts" && currentFolder.current !== "drafts") {
      currentFolder.current = "drafts";
      fetchEmails("drafts");
    } else if (state.currentView === "trash" && currentFolder.current !== "trash") {
      currentFolder.current = "trash";
      fetchEmails("trash");
    }
  }, [state.currentView, fetchEmails]);

  if (!mounted) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold capitalize">Inbox</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 border-b px-4 py-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state.currentView === "compose") {
    return <ComposeForm />;
  }

  if (state.currentView === "email-detail" && loadingEmail) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading email...</div>
      </div>
    );
  }

  if (state.currentView === "email-detail" && selectedEmail) {
    return <MailDetail email={selectedEmail} />;
  }

  const getFilteredEmails = () => {
    let filtered = [...emails];

    if (state.currentView === "starred") {
      filtered = filtered.filter((e) => e.isStarred);
    }

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.from.email.toLowerCase().includes(q) ||
          e.from.name.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q)
      );
    }

    if (state.activeFilters.unreadOnly) {
      filtered = filtered.filter((e) => !e.isRead);
    }

    return filtered;
  };

  const filteredEmails = getFilteredEmails();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold capitalize">{state.currentView}</h2>
        <span className="text-sm text-muted-foreground">
          {loading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            `${filteredEmails.length} message${filteredEmails.length !== 1 ? "s" : ""}`
          )}
        </span>
      </div>
      <MailList emails={filteredEmails} onOpenEmail={openEmail} />
    </div>
  );
}
