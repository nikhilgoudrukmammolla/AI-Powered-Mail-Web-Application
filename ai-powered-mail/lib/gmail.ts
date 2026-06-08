import { google } from "googleapis";
import { Email, MailFilter } from "./types";

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

export function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

export function getHeader(headers: any[], name: string): string {
  const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

export function getBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    // Prefer text/html, fall back to text/plain
    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) return decodeBase64(htmlPart.body.data);
    const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64(textPart.body.data);
    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = getBody(part);
        if (nested) return nested;
      }
    }
  }
  return "";
}

export function buildQuery(filter: MailFilter): string {
  const parts: string[] = [];
  if (filter.query) parts.push(filter.query);
  if (filter.from) parts.push(`from:${filter.from}`);
  if (filter.to) parts.push(`to:${filter.to}`);
  if (filter.after) parts.push(`after:${filter.after}`);
  if (filter.before) parts.push(`before:${filter.before}`);
  if (filter.isUnread) parts.push("is:unread");
  if (filter.label) parts.push(`label:${filter.label}`);
  return parts.join(" ");
}

export async function fetchEmails(
  accessToken: string,
  filter: MailFilter = {},
  maxResults: number = 20,
  labelIds: string[] = ["INBOX"],
  pageToken?: string
): Promise<{ emails: Email[]; nextPageToken?: string }> {
  const gmail = getGmailClient(accessToken);
  const q = buildQuery(filter);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    labelIds: q ? undefined : labelIds,
    q: q || undefined,
    pageToken: pageToken || undefined,
  });

  const messages = listRes.data.messages || [];

  const emails: Email[] = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });
      const headers = detail.data.payload?.headers || [];
      return {
        id: detail.data.id!,
        threadId: detail.data.threadId!,
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        subject: getHeader(headers, "Subject"),
        snippet: detail.data.snippet || "",
        body: getBody(detail.data.payload),
        date: getHeader(headers, "Date"),
        isRead: !detail.data.labelIds?.includes("UNREAD"),
        labels: detail.data.labelIds || [],
      };
    })
  );

  return { emails, nextPageToken: listRes.data.nextPageToken ?? undefined };
}

export async function fetchEmailById(accessToken: string, emailId: string): Promise<Email> {
  const gmail = getGmailClient(accessToken);
  const detail = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
    format: "full",
  });
  const headers = detail.data.payload?.headers || [];
  return {
    id: detail.data.id!,
    threadId: detail.data.threadId!,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject"),
    snippet: detail.data.snippet || "",
    body: getBody(detail.data.payload),
    date: getHeader(headers, "Date"),
    isRead: !detail.data.labelIds?.includes("UNREAD"),
    labels: detail.data.labelIds || [],
  };
}

export async function fetchThread(
  accessToken: string,
  threadId: string
): Promise<Email[]> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = res.data.messages || [];
  return messages.map((msg) => {
    const headers = msg.payload?.headers || [];
    return {
      id: msg.id!,
      threadId: msg.threadId!,
      from: getHeader(headers, "From"),
      to: getHeader(headers, "To"),
      subject: getHeader(headers, "Subject"),
      snippet: msg.snippet || "",
      body: getBody(msg.payload),
      date: getHeader(headers, "Date"),
      isRead: !msg.labelIds?.includes("UNREAD"),
      labels: msg.labelIds || [],
    };
  });
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string,
  threadId?: string
): Promise<{ id: string }> {
  const gmail = getGmailClient(accessToken);

  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
  ];
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const message = headers.join("\r\n") + "\r\n\r\n" + body;
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
      threadId: threadId || undefined,
    },
  });

  return { id: res.data.id! };
}

export async function watchMailbox(
  accessToken: string,
  topicName: string
): Promise<{ historyId: string; expiration: string }> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
    },
  });
  return {
    historyId: res.data.historyId!,
    expiration: res.data.expiration!,
  };
}

export async function stopWatch(accessToken: string): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.stop({ userId: "me" });
}

export async function getHistory(
  accessToken: string,
  startHistoryId: string
): Promise<Email[]> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.history.list({
    userId: "me",
    startHistoryId,
    historyTypes: ["messageAdded"],
    labelId: "INBOX",
  });

  const messageIds =
    res.data.history?.flatMap(
      (h) => h.messagesAdded?.map((m) => m.message?.id) || []
    ) || [];
  const uniqueIds = [...new Set(messageIds.filter(Boolean))] as string[];

  if (uniqueIds.length === 0) return [];

  const emails: Email[] = await Promise.all(
    uniqueIds.map(async (id) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      });
      const headers = detail.data.payload?.headers || [];
      return {
        id: detail.data.id!,
        threadId: detail.data.threadId!,
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        subject: getHeader(headers, "Subject"),
        snippet: detail.data.snippet || "",
        body: getBody(detail.data.payload),
        date: getHeader(headers, "Date"),
        isRead: !detail.data.labelIds?.includes("UNREAD"),
        labels: detail.data.labelIds || [],
      };
    })
  );

  return emails;
}

export async function markAsRead(accessToken: string, emailId: string): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}
