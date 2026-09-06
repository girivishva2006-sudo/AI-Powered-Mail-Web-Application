"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { MailFolder } from "@/types/mail";
import {
  Inbox,
  Send,
  Star,
  FileText,
  Trash2,
  Plus,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  id: MailFolder;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" /> },
  { id: "sent", label: "Sent", icon: <Send className="h-4 w-4" /> },
  { id: "starred", label: "Starred", icon: <Star className="h-4 w-4" /> },
  { id: "drafts", label: "Drafts", icon: <FileText className="h-4 w-4" /> },
  { id: "trash", label: "Trash", icon: <Trash2 className="h-4 w-4" /> },
];

const mockCounts: Record<string, number> = {
  inbox: 8,
  sent: 2,
  starred: 3,
  drafts: 1,
  trash: 1,
};

export function MailSidebar() {
  const { state, dispatch } = useApp();
  const [counts, setCounts] = useState<Record<string, number>>(mockCounts);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const folders = ["inbox", "sent", "drafts", "trash", "starred"];
        const results: Record<string, number> = {};

        for (const folder of folders) {
          const response = await fetch(`/api/mail?folder=${folder}`);
          if (response.ok) {
            const data = await response.json();
            results[folder] = data.messages?.length || 0;
          } else {
            results[folder] = mockCounts[folder] || 0;
          }
        }

        setCounts(results);
      } catch {
        setCounts(mockCounts);
      }
    };

    fetchCounts();
  }, []);

  const handleCompose = () => {
    dispatch({ type: "SET_VIEW", payload: "compose" });
    dispatch({
      type: "UPDATE_COMPOSE",
      payload: { to: "", subject: "", body: "" },
    });
  };

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Mail className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">AI Mail</span>
      </div>

      <div className="p-3">
        <Button onClick={handleCompose} className="w-full justify-start gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: "SET_VIEW", payload: item.id })}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
              state.currentView === item.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </div>
            {counts[item.id] !== undefined && counts[item.id] > 0 && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                state.currentView === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {counts[item.id]}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
