"use client";

import { ArrowLeft, Reply, Forward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMailContext } from "@/lib/mail-context";
import { formatDistanceToNow } from "date-fns";

export function EmailDetail() {
  const { selectedEmail, setCurrentView, openCompose } = useMailContext();

  if (!selectedEmail) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select an email to read</p>
      </div>
    );
  }

  const senderName = selectedEmail.from.includes("<")
    ? selectedEmail.from.split("<")[0].trim().replace(/"/g, "")
    : selectedEmail.from;

  const senderEmail = selectedEmail.from.includes("<")
    ? selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from
    : selectedEmail.from;

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(selectedEmail.date), { addSuffix: true });
  } catch {
    timeAgo = selectedEmail.date;
  }

  const handleReply = () => {
    openCompose(
      senderEmail,
      `Re: ${selectedEmail.subject}`,
      `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\n\n`,
      selectedEmail
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("inbox")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{selectedEmail.subject || "(no subject)"}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={handleReply}>
          <Reply className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{senderName}</p>
            <p className="text-xs text-muted-foreground">{senderEmail}</p>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">To: {selectedEmail.to}</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
        />
      </ScrollArea>
    </div>
  );
}
