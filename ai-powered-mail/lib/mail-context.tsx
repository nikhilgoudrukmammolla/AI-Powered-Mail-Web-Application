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

  // Actions
  fetchInbox: (filter?: MailFilter) => Promise<void>;
  fetchSent: (filter?: MailFilter) => Promise<void>;
  openEmail: (emailId: string) => Promise<void>;
  openCompose: (to?: string, subject?: string, body?: string, replyTo?: Email) => void;
  sendMail: (to: string, subject: string, body: string) => Promise<boolean>;
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

  const buildParams = useCallback((f: MailFilter | undefined, label: string, pageToken?: string) => {
    const params = new URLSearchParams();
    const activeFilter = f || filter;
    if (activeFilter.query) params.set("q", activeFilter.query);
    if (activeFilter.from) params.set("from", activeFilter.from);
    if (activeFilter.after) params.set("after", activeFilter.after);
    if (activeFilter.before) params.set("before", activeFilter.before);
    if (activeFilter.isUnread) params.set("unread", "true");
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

  const openEmail = useCallback(async (emailId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/emails/${emailId}`);
      if (res.ok) {
        const email = await res.json();
        setSelectedEmail(email);
        setCurrentView("detail");
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
        fetchInbox, fetchSent, openEmail, openCompose, sendMail,
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
