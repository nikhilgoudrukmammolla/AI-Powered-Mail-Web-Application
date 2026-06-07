"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { EmailList } from "./email-list";
import { EmailDetail } from "./email-detail";
import { ComposeForm } from "./compose-form";
import { MailFilters } from "./mail-filters";
import { AIAssistant } from "./ai-assistant";
import { useMailContext } from "@/lib/mail-context";

function MainContent() {
  const { currentView } = useMailContext();

  switch (currentView) {
    case "compose":
      return <ComposeForm />;
    case "detail":
      return <EmailDetail />;
    case "inbox":
    case "sent":
    default:
      return (
        <div className="flex flex-col h-full">
          <MailFilters />
          <div className="flex-1 overflow-hidden">
            <EmailList />
          </div>
        </div>
      );
  }
}

export function MailApp() {
  const { fetchInbox } = useMailContext();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      fetchInbox();
    }
  }, [status, fetchInbox]);

  // Poll for new emails every 30 seconds
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(() => {
      fetchInbox();
    }, 30000);
    return () => clearInterval(interval);
  }, [status, fetchInbox]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <MainContent />
      </main>
      <AIAssistant />
    </div>
  );
}
