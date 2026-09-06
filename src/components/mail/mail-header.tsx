"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useApp } from "@/lib/app-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Search, PanelRightOpen, PanelRightClose, LogOut, Moon, Sun } from "lucide-react";

export function MailHeader() {
  const { state, dispatch } = useApp();
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            className="pl-9"
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                dispatch({
                  type: "SET_FILTERS",
                  payload: { query: state.searchQuery },
                });
              }
            }}
          />
        </div>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleDarkMode} title="Toggle dark mode">
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => dispatch({ type: "TOGGLE_ASSISTANT" })}
        title={state.isAssistantOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {state.isAssistantOpen ? (
          <PanelRightClose className="h-5 w-5" />
        ) : (
          <PanelRightOpen className="h-5 w-5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign out"
      >
        <LogOut className="h-5 w-5" />
      </Button>

      <Avatar size="md" fallback="U" />
    </header>
  );
}
