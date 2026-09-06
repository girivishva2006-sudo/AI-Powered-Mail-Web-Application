"use client";

import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "@/lib/app-context";
import { ToastProvider } from "@/components/ui/toast";
import { MailSidebar } from "@/components/mail/mail-sidebar";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { MailPage } from "@/components/mail/mail-page";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelRightClose, PanelRightOpen, Moon, Sun } from "lucide-react";
import Link from "next/link";

function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function DemoAppContent() {
  const { state, dispatch } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <div className={`${sidebarOpen ? "w-56" : "w-0"} transition-all duration-300 overflow-hidden`}>
        <MailSidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with sidebar toggle */}
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Demo Mode
          </span>
          <div className="flex-1" />
          <ThemeToggle />
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </header>

        {/* Mail Content + Assistant */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <MailPage />
          </main>

          {/* Collapsible Assistant Panel */}
          <div className={`${assistantOpen ? "w-96" : "w-12"} transition-all duration-300 border-l`}>
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center justify-between border-b px-4">
                {assistantOpen && <h3 className="font-semibold">AI Assistant</h3>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAssistantOpen(!assistantOpen)}
                >
                  {assistantOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {assistantOpen && <AssistantPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load dark mode preference
    const isDark = localStorage.getItem("darkMode") === "true";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading demo...</div>
      </div>
    );
  }

  return (
    <AppProvider>
      <ToastProvider>
        <DemoAppContent />
      </ToastProvider>
    </AppProvider>
  );
}
