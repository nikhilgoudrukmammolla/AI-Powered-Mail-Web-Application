"use client";

import { useEffect, useRef } from "react";
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

  // Register Gmail push notifications and poll Redis for new emails
  const lastPollTs = useRef(Date.now());

  useEffect(() => {
    if (status !== "authenticated") return;

    // Stop any existing watch, then register a fresh one
    fetch("/api/gmail/watch", { method: "DELETE" })
      .catch(() => {}) // ignore if no watch exists
      .then(() => fetch("/api/gmail/watch", { method: "POST" }))
      .catch((err) => console.error("Failed to register Gmail watch:", err));

    // Poll Redis-backed endpoint every 15 seconds for webhook notifications
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/gmail/poll?since=${lastPollTs.current}`);
        const data = await res.json();
        if (data.hasNew) {
          console.log("[Poll] New email detected, refreshing inbox...");
          lastPollTs.current = data.timestamp;
          fetchInbox();
        }
      } catch (err) {
        console.error("[Poll] Error checking for new mail:", err);
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
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
