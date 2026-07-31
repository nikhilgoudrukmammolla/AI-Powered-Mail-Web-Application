"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { EmailList } from "./email-list";
import { EmailDetail } from "./email-detail";
import { ComposeForm } from "./compose-form";
import { MailFilters } from "./mail-filters";
import { AIAssistant } from "./ai-assistant";
import { MobileNav } from "./mobile-nav";
import { UndoToast } from "./undo-toast";
import { AIProviderSettings } from "./ai-provider-settings";
import { useMailContext } from "@/lib/mail-context";
import { useAIConfig } from "@/lib/ai-config-context";

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
  const { hydrated, isConfigured, openSettings } = useAIConfig();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch inbox on initial login — only once. Do NOT depend on fetchInbox,
  // whose identity changes when the filter changes (navigating to Sent/Trash),
  // otherwise this effect would re-run and snap the view back to Inbox.
  const didInitialFetch = useRef(false);
  useEffect(() => {
    if (status === "authenticated" && !didInitialFetch.current) {
      didInitialFetch.current = true;
      fetchInbox();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // First-time prompt: once logged in and localStorage has been read, if no
  // provider is configured yet, open the Keys panel so the user can pick one.
  const didPromptConfig = useRef(false);
  useEffect(() => {
    if (status === "authenticated" && hydrated && !isConfigured && !didPromptConfig.current) {
      didPromptConfig.current = true;
      openSettings();
    }
  }, [status, hydrated, isConfigured, openSettings]);

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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: hidden on mobile unless open, always visible on md+ */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 md:static md:flex md:translate-x-0
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <MainContent />
        {/* Spacer so content isn't hidden behind mobile bottom nav */}
        <div className="h-16 shrink-0 md:hidden" />
      </main>

      <AIAssistant />

      {/* Undo toast */}
      <UndoToast />

      {/* AI provider keys modal */}
      <AIProviderSettings />

      {/* Mobile bottom nav */}
      <MobileNav onMenuOpen={() => setSidebarOpen(true)} />
    </div>
  );
}
