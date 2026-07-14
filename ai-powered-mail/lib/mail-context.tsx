"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Email, MailFilter, MailView } from "./types";

interface MailContextType {
  // View state
  currentView: MailView;
  setCurrentView: (view: MailView) => void;

  // Emails
  emails: Email[];
  setEmails: (emails: Email[]) => void;
  selectedEmail: Email | null;
  setSelectedEmail: (email: Email | null) => void;

  // Compose state
  composeTo: string;
  setComposeTo: (to: string) => void;
  composeSubject: string;
  setComposeSubject: (subject: string) => void;
  composeBody: string;
  setComposeBody: (body: string) => void;
  replyToEmail: Email | null;
  setReplyToEmail: (email: Email | null) => void;

  // Filters
  filter: MailFilter;
  setFilter: (filter: MailFilter) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;

  // Thread
  threadMessages: Email[];

  // Actions
  fetchInbox: (filter?: MailFilter) => Promise<void>;
  fetchSent: (filter?: MailFilter) => Promise<void>;
  fetchTrash: (filter?: MailFilter) => Promise<void>;
  openEmail: (emailId: string) => Promise<void>;
  openCompose: (to?: string, subject?: string, body?: string, replyTo?: Email) => void;
  sendMail: (to: string, subject: string, body: string) => Promise<boolean>;

  // Delete / Trash
  trashEmail: (emailId: string, permanent?: boolean) => Promise<boolean>;
  trashByIds: (ids: string[], permanent?: boolean) => Promise<number>;
  deleteByFilter: (
    filter: MailFilter,
    folder?: string,
    permanent?: boolean
  ) => Promise<number>;
  previewDelete: (
    filter: MailFilter,
    folder?: string
  ) => Promise<{ count: number; ids: string[] }>;
  emptyTrashAll: () => Promise<number>;
  undoDelete: () => Promise<boolean>;
  lastDeleted: { ids: string[]; permanent: boolean } | null;
  clearLastDeleted: () => void;
}

const MailContext = createContext<MailContextType | undefined>(undefined);

export function MailProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<MailView>("inbox");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [replyToEmail, setReplyToEmail] = useState<Email | null>(null);
  const [filter, setFilter] = useState<MailFilter>({});
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [currentLabel, setCurrentLabel] = useState("INBOX");
  const [lastDeleted, setLastDeleted] = useState<{ ids: string[]; permanent: boolean } | null>(null);

  const buildParams = useCallback((f: MailFilter | undefined, label: string, pageToken?: string) => {
    const params = new URLSearchParams();
    const activeFilter = f || filter;
    if (activeFilter.query) params.set("q", activeFilter.query);
    if (activeFilter.from) params.set("from", activeFilter.from);
    if (activeFilter.after) params.set("after", activeFilter.after);
    if (activeFilter.before) params.set("before", activeFilter.before);
    if (activeFilter.isUnread) params.set("unread", "true");
    if (activeFilter.subject) params.set("subject", activeFilter.subject);
    if (activeFilter.category) params.set("category", activeFilter.category);
    params.set("label", label);
    if (pageToken) params.set("pageToken", pageToken);
    return params;
  }, [filter]);

  const fetchInbox = useCallback(async (f?: MailFilter) => {
    setIsLoading(true);
    try {
      const params = buildParams(f, "INBOX");
      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setNextPageToken(data.nextPageToken);
        setCurrentLabel("INBOX");
        setCurrentView("inbox");
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const fetchSent = useCallback(async (f?: MailFilter) => {
    setIsLoading(true);
    try {
      const params = buildParams(f, "SENT");
      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setNextPageToken(data.nextPageToken);
        setCurrentLabel("SENT");
        setCurrentView("sent");
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const fetchTrash = useCallback(async (f?: MailFilter) => {
    setIsLoading(true);
    try {
      const params = buildParams(f, "TRASH");
      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
        setNextPageToken(data.nextPageToken);
        setCurrentLabel("TRASH");
        setCurrentView("trash");
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  const loadMore = useCallback(async () => {
    if (!nextPageToken) return;
    setIsLoading(true);
    try {
      const params = buildParams(filter, currentLabel, nextPageToken);
      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails((prev) => [...prev, ...data.emails]);
        setNextPageToken(data.nextPageToken);
      }
    } finally {
      setIsLoading(false);
    }
  }, [nextPageToken, buildParams, filter, currentLabel]);

  const [threadMessages, setThreadMessages] = useState<Email[]>([]);

  const openEmail = useCallback(async (emailId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/emails/${emailId}`);
      if (res.ok) {
        const email = await res.json();
        setSelectedEmail(email);
        setCurrentView("detail");

        // Fetch thread if it has a threadId
        if (email.threadId) {
          const threadRes = await fetch(`/api/emails/thread/${email.threadId}`);
          if (threadRes.ok) {
            const messages = await threadRes.json();
            setThreadMessages(messages);
          } else {
            setThreadMessages([]);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openCompose = useCallback((to?: string, subject?: string, body?: string, replyTo?: Email) => {
    setComposeTo(to || "");
    setComposeSubject(subject || "");
    setComposeBody(body || "");
    setReplyToEmail(replyTo || null);
    setCurrentView("compose");
  }, []);

  const sendMail = useCallback(async (to: string, subject: string, body: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          body,
          threadId: replyToEmail?.threadId,
        }),
      });
      if (res.ok) {
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        setReplyToEmail(null);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [replyToEmail]);

  // ---------------- Delete / Trash ----------------

  // Trash (or permanently delete) a single email. Removes it from the current list optimistically.
  const trashEmail = useCallback(async (emailId: string, permanent = false): Promise<boolean> => {
    try {
      const res = await fetch(`/api/emails/${emailId}?permanent=${permanent}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== emailId));
        setSelectedEmail((prev) => (prev?.id === emailId ? null : prev));
        setLastDeleted(permanent ? null : { ids: [emailId], permanent });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Trash (or permanently delete) a specific set of emails by their IDs.
  const trashByIds = useCallback(async (ids: string[], permanent = false): Promise<number> => {
    if (ids.length === 0) return 0;
    setIsLoading(true);
    try {
      const res = await fetch("/api/emails/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, permanent }),
      });
      if (res.ok) {
        const data = await res.json();
        const deletedIds: string[] = data.ids || [];
        setEmails((prev) => prev.filter((e) => !deletedIds.includes(e.id)));
        setLastDeleted(permanent ? null : { ids: deletedIds, permanent });
        return data.deleted || 0;
      }
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Preview how many emails match a filter without deleting them.
  const previewDelete = useCallback(
    async (f: MailFilter, folder = "INBOX"): Promise<{ count: number; ids: string[] }> => {
      const res = await fetch("/api/emails/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filter: f, folder, preview: true }),
      });
      if (res.ok) {
        const data = await res.json();
        return { count: data.count, ids: data.ids };
      }
      return { count: 0, ids: [] };
    },
    []
  );

  // Bulk delete all emails matching a filter. Returns number deleted.
  const deleteByFilter = useCallback(
    async (f: MailFilter, folder = "INBOX", permanent = false): Promise<number> => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/emails/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: f, folder, permanent }),
        });
        if (res.ok) {
          const data = await res.json();
          const deletedIds: string[] = data.ids || [];
          setEmails((prev) => prev.filter((e) => !deletedIds.includes(e.id)));
          setLastDeleted(permanent ? null : { ids: deletedIds, permanent });
          return data.deleted || 0;
        }
        return 0;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Permanently empty the Trash.
  const emptyTrashAll = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/emails/empty-trash", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (currentLabel === "TRASH") setEmails([]);
        setLastDeleted(null);
        return data.deleted || 0;
      }
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [currentLabel]);

  // Restore the most recently trashed emails.
  const undoDelete = useCallback(async (): Promise<boolean> => {
    if (!lastDeleted || lastDeleted.permanent || lastDeleted.ids.length === 0) return false;
    const res = await fetch("/api/emails/untrash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: lastDeleted.ids }),
    });
    if (res.ok) {
      setLastDeleted(null);
      // Refresh whichever folder we're viewing so restored mail reappears.
      if (currentLabel === "INBOX") await fetchInbox(filter);
      else if (currentLabel === "SENT") await fetchSent(filter);
      else if (currentLabel === "TRASH") await fetchTrash(filter);
      return true;
    }
    return false;
  }, [lastDeleted, currentLabel, filter, fetchInbox, fetchSent, fetchTrash]);

  const clearLastDeleted = useCallback(() => setLastDeleted(null), []);

  return (
    <MailContext.Provider
      value={{
        currentView, setCurrentView,
        emails, setEmails,
        selectedEmail, setSelectedEmail,
        composeTo, setComposeTo,
        composeSubject, setComposeSubject,
        composeBody, setComposeBody,
        replyToEmail, setReplyToEmail,
        filter, setFilter,
        isLoading, setIsLoading,
        hasMore: !!nextPageToken,
        loadMore,
        threadMessages,
        fetchInbox, fetchSent, fetchTrash, openEmail, openCompose, sendMail,
        trashEmail, trashByIds, deleteByFilter, previewDelete, emptyTrashAll, undoDelete,
        lastDeleted, clearLastDeleted,
      }}
    >
      {children}
    </MailContext.Provider>
  );
}

export function useMailContext() {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error("useMailContext must be used within a MailProvider");
  }
  return context;
}
