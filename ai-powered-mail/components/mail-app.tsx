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

  // Fetch inbox on initial login
  useEffect(() => {
    if (status === "authenticated") {
      fetchInbox();
    }
  }, [status, fetchInbox]);

  // Register Gmail push notifications and listen via SSE
  useEffect(() => {
    if (status !== "authenticated") return;

    // Register Gmail watch for Pub/Sub push notifications
    fetch("/api/gmail/watch", { method: "POST" }).catch((err) =>
      console.error("Failed to register Gmail watch:", err)
    );

    // Open SSE connection to receive real-time push events
    const eventSource = new EventSource("/api/gmail/events");

    eventSource.onmessage = (event) => {
      console.log("[SSE] New email notification received");
      fetchInbox();
    };

    eventSource.onerror = (err) => {
      console.error("[SSE] Connection error, will auto-reconnect:", err);
    };

    return () => {
      eventSource.close();
    };
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
