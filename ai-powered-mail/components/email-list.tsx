"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2, Mail, MailOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMailContext } from "@/lib/mail-context";
import { cn } from "@/lib/utils";
import { Email } from "@/lib/types";

function EmailItem({ email }: { email: Email }) {
  const { openEmail } = useMailContext();

  const senderName = email.from.includes("<")
    ? email.from.split("<")[0].trim().replace(/"/g, "")
    : email.from;

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(email.date), { addSuffix: true });
  } catch {
    timeAgo = email.date;
  }

  return (
    <button
      onClick={() => openEmail(email.id)}
      className={cn(
        "w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors",
        !email.isRead && "bg-muted/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {email.isRead ? (
            <MailOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Mail className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm truncate", !email.isRead && "font-semibold")}>
              {senderName}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {timeAgo}
            </span>
          </div>
          <p className={cn("text-sm truncate", !email.isRead && "font-medium")}>
            {email.subject || "(no subject)"}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {email.snippet}
          </p>
        </div>
      </div>
    </button>
  );
}

export function EmailList() {
  const { emails, isLoading, currentView, hasMore, loadMore } = useMailContext();

  if (isLoading && emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isLoading && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Mail className="h-12 w-12 mb-2" />
        <p>No emails found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <EmailItem key={email.id} email={email} />
        ))}
      </div>
      {hasMore && (
        <div className="flex ml-7 py-4">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </ScrollArea>
  );
}
