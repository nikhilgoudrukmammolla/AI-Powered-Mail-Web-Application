"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useMailContext } from "@/lib/mail-context";
import { Mail, MailOpen, Send, Forward, Reply, ArrowRight } from "lucide-react";

export function AIAssistant() {
  const {
    currentView,
    emails,
    selectedEmail,
    fetchInbox,
    fetchSent,
    openEmail,
    openCompose,
    sendMail,
    setFilter,
    setCurrentView,
    composeTo,
    composeSubject,
    composeBody,
    setComposeTo,
    setComposeSubject,
    setComposeBody,
  } = useMailContext();

  // Provide readable context to the AI
  useCopilotReadable({
    description: "The current view the user is on",
    value: currentView,
  });

  useCopilotReadable({
    description: "The list of emails currently displayed in the mail client",
    value: JSON.stringify(
      emails.map((e) => ({
        id: e.id,
        from: e.from,
        subject: e.subject,
        date: e.date,
        isRead: e.isRead,
        snippet: e.snippet,
      }))
    ),
  });

  useCopilotReadable({
    description: "The email currently being viewed/read by the user (if any)",
    value: selectedEmail
      ? JSON.stringify({
          id: selectedEmail.id,
          from: selectedEmail.from,
          to: selectedEmail.to,
          subject: selectedEmail.subject,
          date: selectedEmail.date,
          body: selectedEmail.body.substring(0, 500),
        })
      : "No email currently open",
  });

  useCopilotReadable({
    description: "Current compose form state (if compose view is open)",
    value: currentView === "compose"
      ? JSON.stringify({ to: composeTo, subject: composeSubject, body: composeBody.substring(0, 200) })
      : "Compose form is not open",
  });

  // Action: Compose email (human-in-the-loop — never auto-sends)
  useCopilotAction({
    name: "composeEmail",
    description:
      "Compose a new email. Opens the compose view and fills in the fields visibly. NEVER sends automatically — the user must review and confirm. Use this when the user asks to write, draft, or send an email.",
    parameters: [
      { name: "to", type: "string", description: "Recipient email address", required: true },
      { name: "subject", type: "string", description: "Email subject line", required: true },
      { name: "body", type: "string", description: "Email body content", required: true },
    ],
    handler: async ({ to, subject, body }) => {
      openCompose(to, subject, body);
      return `Compose form opened and filled:\n• To: ${to}\n• Subject: ${subject}\n\nPlease review the email and click Send, or tell me to send it.`;
    },
    render: ({ args, status }) => {
      if (status === "executing" || status === "complete") {
        return (
          <div className="rounded-lg border border-border bg-card p-3 my-2 text-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Send className="h-3.5 w-3.5" />
              <span className="font-medium">Draft Email</span>
            </div>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">To:</span> {args.to}</p>
              <p><span className="text-muted-foreground">Subject:</span> {args.subject}</p>
              <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{args.body}</p>
            </div>
            {status === "complete" && (
              <p className="text-xs text-amber-500 mt-2">⏳ Awaiting your review — click Send in the compose form or ask me to send it.</p>
            )}
          </div>
        );
      }
      return <></>;
    },
  });

  // Action: Confirm and send the current draft (human-in-the-loop step 2)
  useCopilotAction({
    name: "confirmSendEmail",
    description:
      "Send the email currently in the compose form. Only use this AFTER composeEmail has been called and the user explicitly confirms they want to send it (e.g. 'yes send it', 'go ahead', 'send').",
    parameters: [],
    handler: async () => {
      if (!composeTo || !composeSubject) {
        return "No email is drafted. Please compose an email first.";
      }
      const success = await sendMail(composeTo, composeSubject, composeBody);
      if (success) {
        return `Email sent successfully to ${composeTo}!`;
      }
      return "Failed to send email. Please try again.";
    },
    render: ({ status }) => {
      if (status === "complete") {
        return (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 my-2 text-sm">
            <p className="text-green-400 flex items-center gap-2">
              <Send className="h-3.5 w-3.5" /> Email sent!
            </p>
          </div>
        );
      }
      return <></>;
    },
  });

  // Action: Search/filter emails
  useCopilotAction({
    name: "searchEmails",
    description:
      "Search and filter emails. The UI will update to show matching results. Use this when the user asks to find, show, or filter emails by sender, date, keyword, or read status.",
    parameters: [
      { name: "query", type: "string", description: "General search query/keyword", required: false },
      { name: "from", type: "string", description: "Filter by sender email or name", required: false },
      { name: "after", type: "string", description: "Show emails after this date (YYYY/MM/DD format)", required: false },
      { name: "before", type: "string", description: "Show emails before this date (YYYY/MM/DD format)", required: false },
      { name: "unreadOnly", type: "boolean", description: "Show only unread emails", required: false },
      { name: "folder", type: "string", description: "Which folder: 'inbox' or 'sent'. Defaults to 'inbox'", required: false },
    ],
    handler: async ({ query, from, after, before, unreadOnly, folder = "inbox" }) => {
      const newFilter = {
        query: query || undefined,
        from: from || undefined,
        after: after || undefined,
        before: before || undefined,
        isUnread: unreadOnly || undefined,
      };
      setFilter(newFilter);

      if (folder === "sent") {
        await fetchSent(newFilter);
      } else {
        await fetchInbox(newFilter);
      }
      return `Updated the ${folder} view with filtered results.`;
    },
    render: ({ args, status }) => {
      const filters = [];
      if (args.query) filters.push(`keyword "${args.query}"`);
      if (args.from) filters.push(`from ${args.from}`);
      if (args.after) filters.push(`after ${args.after}`);
      if (args.before) filters.push(`before ${args.before}`);
      if (args.unreadOnly) filters.push("unread only");

      if (status === "executing") {
        return (
          <div className="rounded-lg border border-border bg-card p-3 my-2 text-sm text-muted-foreground">
            Searching{filters.length > 0 ? `: ${filters.join(", ")}` : ""}...
          </div>
        );
      }

      if (status === "complete") {
        return (
          <div className="rounded-lg border border-border bg-card p-3 my-2 text-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="font-medium">Search Results</span>
              <span className="ml-auto text-xs">{emails.length} emails</span>
            </div>
            {emails.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {emails.slice(0, 5).map((e) => {
                  const sender = e.from.includes("<")
                    ? e.from.split("<")[0].trim().replace(/"/g, "")
                    : e.from;
                  return (
                    <button
                      key={e.id}
                      onClick={() => openEmail(e.id)}
                      className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors flex items-start gap-2"
                    >
                      {e.isRead ? (
                        <MailOpen className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                      ) : (
                        <Mail className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs truncate ${!e.isRead ? "font-semibold" : ""}`}>{sender}</p>
                        <p className="text-xs text-muted-foreground truncate">{e.subject || "(no subject)"}</p>
                      </div>
                    </button>
                  );
                })}
                {emails.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{emails.length - 5} more in the main view</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No emails found matching your criteria.</p>
            )}
          </div>
        );
      }
      return <></>;
    },
  });

  // Action: Open a specific email
  useCopilotAction({
    name: "openEmail",
    description:
      "Open and display a specific email in the detail view. Use this when the user asks to open, read, or view a specific email. You can identify the email from the currently displayed list.",
    parameters: [
      { name: "emailId", type: "string", description: "The ID of the email to open from the displayed list", required: true },
    ],
    handler: async ({ emailId }) => {
      await openEmail(emailId);
      return "Email opened in detail view.";
    },
  });

  // Action: Reply to current email (human-in-the-loop)
  useCopilotAction({
    name: "replyToEmail",
    description:
      "Reply to the currently opened email. Opens compose with pre-filled reply context. NEVER sends automatically. Use when user says 'reply to this' or 'respond to this email'.",
    parameters: [
      { name: "body", type: "string", description: "The reply message body", required: true },
    ],
    handler: async ({ body }) => {
      if (!selectedEmail) {
        return "No email is currently open. Please open an email first.";
      }

      const replyTo = selectedEmail.from.includes("<")
        ? selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from
        : selectedEmail.from;

      const replySubject = selectedEmail.subject.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`;

      openCompose(replyTo, replySubject, body, selectedEmail);
      return `Reply form opened to ${replyTo}. Please review and click Send, or ask me to send it.`;
    },
    render: ({ args, status }) => {
      if (status === "executing" || status === "complete") {
        return (
          <div className="rounded-lg border border-border bg-card p-3 my-2 text-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Reply className="h-3.5 w-3.5" />
              <span className="font-medium">Reply Draft</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">{args.body}</p>
            {status === "complete" && (
              <p className="text-xs text-amber-500 mt-2">⏳ Review the reply and click Send, or ask me to send it.</p>
            )}
          </div>
        );
      }
      return <></>;
    },
  });

  // Action: Forward current email
  useCopilotAction({
    name: "forwardEmail",
    description:
      "Forward the currently opened email to another recipient. Opens compose with forwarded content. Use when user says 'forward this' or 'forward to someone'.",
    parameters: [
      { name: "to", type: "string", description: "Recipient email address to forward to", required: true },
      { name: "additionalMessage", type: "string", description: "Optional message to add above the forwarded content", required: false },
    ],
    handler: async ({ to, additionalMessage }) => {
      if (!selectedEmail) {
        return "No email is currently open. Please open an email first.";
      }

      const fwdSubject = selectedEmail.subject.startsWith("Fwd:")
        ? selectedEmail.subject
        : `Fwd: ${selectedEmail.subject}`;

      const fwdBody = `${additionalMessage || ""}\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\nTo: ${selectedEmail.to}\n\n${selectedEmail.body}`;

      openCompose(to, fwdSubject, fwdBody);
      return `Forward form opened to ${to}. Please review and click Send, or ask me to send it.`;
    },
    render: ({ args, status }) => {
      if (status === "executing" || status === "complete") {
        return (
          <div className="rounded-lg border border-border bg-card p-3 my-2 text-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Forward className="h-3.5 w-3.5" />
              <span className="font-medium">Forward Email</span>
            </div>
            <p><span className="text-muted-foreground">To:</span> {args.to}</p>
            {status === "complete" && (
              <p className="text-xs text-amber-500 mt-2">⏳ Review and click Send, or ask me to send it.</p>
            )}
          </div>
        );
      }
      return <></>;
    },
  });

  // Action: Navigate to a view
  useCopilotAction({
    name: "navigateTo",
    description:
      "Navigate to a specific view in the mail app (inbox, sent, or compose). Use when user says 'go to inbox', 'show sent emails', etc.",
    parameters: [
      { name: "view", type: "string", description: "The view to navigate to: 'inbox', 'sent', or 'compose'", required: true },
    ],
    handler: async ({ view }) => {
      if (view === "inbox") {
        await fetchInbox({});
        return "Navigated to Inbox.";
      } else if (view === "sent") {
        await fetchSent({});
        return "Navigated to Sent.";
      } else if (view === "compose") {
        openCompose();
        return "Compose view opened.";
      }
      return "Unknown view.";
    },
  });

  return (
    <CopilotSidebar
      defaultOpen={true}
      instructions={`You are an AI assistant for a mail application. You can:
1. Compose emails — use composeEmail to fill the form. NEVER send automatically.
2. Send emails — ONLY use confirmSendEmail AFTER the user explicitly says "send it", "yes", "go ahead", etc.
3. Search and filter emails — use searchEmails to update the main UI with results.
4. Open and read specific emails — use openEmail with an ID from the displayed list.
5. Reply to emails — use replyToEmail when an email is open and user says "reply to this".
6. Forward emails — use forwardEmail when an email is open and user says "forward this to X".
7. Navigate between views — use navigateTo for inbox, sent, or compose.

IMPORTANT RULES:
- Always use composeEmail first, then wait for user confirmation before calling confirmSendEmail.
- When searching by date, calculate the correct YYYY/MM/DD from relative terms like "last 10 days".
- When opening an email, match the user's description to the email list context you have.
- Today's date is ${new Date().toISOString().split("T")[0]}.`}
      labels={{
        title: "Mail Assistant",
        initial: "Hi! I can help you manage your emails. Try:\n• \"Send an email to john@example.com\"\n• \"Show unread emails from this week\"\n• \"Open the latest email\"\n• \"Reply to this\" or \"Forward this to jane@example.com\"",
      }}
    />
  );
}
