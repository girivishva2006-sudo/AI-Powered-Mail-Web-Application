"use client";

import React, { Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/ui/toast";
import { MailSidebar } from "@/components/mail/mail-sidebar";
import { MailHeader } from "@/components/mail/mail-header";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { MailPage } from "@/components/mail/mail-page";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle } from "lucide-react";

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          Your email is not authorized to access this application.
        </p>
        <p className="text-sm text-muted-foreground">
          Please contact the administrator to request access.
        </p>
        <Button onClick={() => signIn("google")} variant="outline" className="w-full">
          Try Another Account
        </Button>
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">AI Mail</h1>
          <p className="mt-2 text-muted-foreground">
            AI-Powered Email Client
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => signIn("google")}
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Sign in with your Google account to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <MailSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <MailHeader />
            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-hidden">
                <MailPage />
              </main>
              <AssistantPanel />
            </div>
          </div>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}

function HomeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error === "AccessDenied") {
    return <AccessDenied />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return <AppContent />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
