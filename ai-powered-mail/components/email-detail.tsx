"use client";

import { useState } from "react";
import { ArrowLeft, Reply, Forward, ChevronDown, ChevronRight, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMailContext } from "@/lib/mail-context";
import { formatDistanceToNow } from "date-fns";
import { Email } from "@/lib/types";
import { cn } from "@/lib/utils";

function ThreadMessage({ email, isExpanded, onToggle }: { email: Email; isExpanded: boolean; onToggle: () => void }) {
  const senderName = email.from.includes("<")
    ? email.from.split("<")[0].trim().replace(/"/g, "")
    : email.from;

  const senderEmail = email.from.includes("<")
    ? email.from.match(/<(.+)>/)?.[1] || email.from
    : email.from;

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(email.date), { addSuffix: true });
  } catch {
    timeAgo = email.date;
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className={cn(
          "w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-muted/30 transition-colors",
          isExpanded && "bg-muted/20"
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{senderName}</p>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
          </div>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground mb-3">
            {senderEmail} → {email.to}
          </p>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />
        </div>
      )}
    </div>
  );
}

export function EmailDetail() {
  const { selectedEmail, setCurrentView, openCompose, threadMessages, trashEmail } = useMailContext();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!selectedEmail) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select an email to read</p>
      </div>
    );
  }

  const senderEmail = selectedEmail.from.includes("<")
    ? selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from
    : selectedEmail.from;

  const handleReply = () => {
    openCompose(
      senderEmail,
      `Re: ${selectedEmail.subject}`,
      `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\n\n`,
      selectedEmail
    );
  };

  const handleForward = () => {
    openCompose(
      "",
      `Fwd: ${selectedEmail.subject}`,
      `\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\nTo: ${selectedEmail.to}\n\n${selectedEmail.body}`
    );
  };

  const handleDelete = async () => {
    const id = selectedEmail.id;
    await trashEmail(id);
    setCurrentView("inbox");
  };

  const toggleMessage = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isThread = threadMessages.length > 1;

  // For thread view: selected message is expanded by default
  const getExpandedState = (id: string) => {
    if (expandedIds.size > 0) return expandedIds.has(id);
    return id === selectedEmail.id;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setCurrentView("inbox")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold truncate leading-tight">{selectedEmail.subject || "(no subject)"}</h2>
          {isThread && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {threadMessages.length} messages
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={handleReply} title="Reply">
          <Reply className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={handleForward} title="Forward">
          <Forward className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          title="Move to Trash"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isThread ? (
          <div>
            {threadMessages.map((msg) => (
              <ThreadMessage
                key={msg.id}
                email={msg}
                isExpanded={getExpandedState(msg.id)}
                onToggle={() => toggleMessage(msg.id)}
              />
            ))}
          </div>
        ) : (
          <SingleEmailView email={selectedEmail} />
        )}
      </ScrollArea>
    </div>
  );
}

function SingleEmailView({ email }: { email: Email }) {
  const senderName = email.from.includes("<")
    ? email.from.split("<")[0].trim().replace(/"/g, "")
    : email.from;

  const senderEmail = email.from.includes("<")
    ? email.from.match(/<(.+)>/)?.[1] || email.from
    : email.from;

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(email.date), { addSuffix: true });
  } catch {
    timeAgo = email.date;
  }

  return (
    <>
      <div className="px-3 sm:px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{senderName}</p>
            <p className="text-xs text-muted-foreground truncate">{senderEmail}</p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{timeAgo}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">To: {email.to}</p>
      </div>
      <div className="p-3 sm:p-4">
        <div
          className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>
    </>
  );
}
