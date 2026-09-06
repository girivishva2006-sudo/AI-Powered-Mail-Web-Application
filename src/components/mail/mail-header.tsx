"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useApp } from "@/lib/app-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Search, LogOut, Moon, Sun } from "lucide-react";

export function MailHeader() {
  const { state, dispatch } = useApp();
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
  };

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            className="pl-10"
            value={state.searchQuery}
            onChange={(e) =>
              dispatch({ type: "SET_SEARCH", payload: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
