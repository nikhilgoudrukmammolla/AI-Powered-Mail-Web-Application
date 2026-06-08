export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  labels: string[];
}

export interface MailFilter {
  query?: string;
  from?: string;
  to?: string;
  after?: string;
  before?: string;
  isUnread?: boolean;
  label?: string;
}

export type MailView = "inbox" | "sent" | "compose" | "detail";
