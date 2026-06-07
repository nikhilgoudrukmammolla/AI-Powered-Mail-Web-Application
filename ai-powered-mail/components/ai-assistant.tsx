"use client";

import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useMailContext } from "@/lib/mail-context";

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

  // Action: Compose and send email
  useCopilotAction({
    name: "composeAndSendEmail",
    description:
      "Compose a new email. Opens the compose view, fills in the fields visibly, and optionally sends it. Use this when the user asks to send or compose an email.",
    parameters: [
      { name: "to", type: "string", description: "Recipient email address", required: true },
      { name: "subject", type: "string", description: "Email subject line", required: true },
      { name: "body", type: "string", description: "Email body content", required: true },
      { name: "autoSend", type: "boolean", description: "Whether to automatically send (true) or just fill the compose form (false). Default true.", required: false },
    ],
    handler: async ({ to, subject, body, autoSend = true }) => {
      // Open compose view and fill fields visibly
      openCompose(to, subject, body);

      if (autoSend) {
        // Small delay so user can see the fields being filled
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const success = await sendMail(to, subject, body);
        return success
          ? `Email sent successfully to ${to} with subject "${subject}"`
          : "Failed to send email. Please try again.";
      }
      return `Compose form opened with To: ${to}, Subject: "${subject}". Ready to send.`;
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
      return `Showing filtered emails. Found results matching your criteria.`;
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

  // Action: Reply to current email
  useCopilotAction({
    name: "replyToEmail",
    description:
      "Reply to the currently opened email. Opens compose with pre-filled reply context. Use when user says 'reply to this' or 'respond to this email'.",
    parameters: [
      { name: "body", type: "string", description: "The reply message body", required: true },
      { name: "autoSend", type: "boolean", description: "Whether to send immediately or just fill the form", required: false },
    ],
    handler: async ({ body, autoSend = false }) => {
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

      if (autoSend) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const success = await sendMail(replyTo, replySubject, body);
        return success
          ? `Reply sent to ${replyTo}`
          : "Failed to send reply.";
      }
      return `Reply form opened to ${replyTo}. Ready to send.`;
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
1. Compose and send emails on behalf of the user
2. Search and filter emails by sender, date, keywords, or read status
3. Open and read specific emails
4. Reply to the currently open email
5. Navigate between views (inbox, sent, compose)

When the user asks to find emails, use the searchEmails action to update the UI.
When the user asks to send an email, use composeAndSendEmail to visibly fill the form and send.
When the user asks to open an email, identify it from the currently displayed list and use openEmail.
When the user says "reply to this", use replyToEmail with the currently open email context.
Always confirm actions with the user and provide helpful feedback.`}
      labels={{
        title: "Mail Assistant",
        initial: "Hi! I can help you manage your emails. Try:\n• \"Send an email to john@example.com\"\n• \"Show unread emails from this week\"\n• \"Open the latest email\"\n• \"Reply to this\"",
      }}
    />
  );
}
