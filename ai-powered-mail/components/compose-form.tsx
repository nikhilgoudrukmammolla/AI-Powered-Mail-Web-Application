"use client";

import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMailContext } from "@/lib/mail-context";

export function ComposeForm() {
  const {
    composeTo, setComposeTo,
    composeSubject, setComposeSubject,
    composeBody, setComposeBody,
    sendMail, setCurrentView, isLoading,
    replyToEmail,
  } = useMailContext();

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSend = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;
    setStatus("sending");
    const success = await sendMail(composeTo, composeSubject, composeBody);
    if (success) {
      setStatus("sent");
      setTimeout(() => setCurrentView("inbox"), 1500);
    } else {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("inbox")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {replyToEmail ? "Reply" : "New Email"}
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To</label>
          <Input
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            placeholder="recipient@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Subject</label>
          <Input
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            placeholder="Email subject"
          />
        </div>

        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">Body</label>
          <Textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Write your email..."
            className="min-h-[200px] resize-none"
          />
        </div>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <div>
          {status === "sent" && <span className="text-sm text-green-500">Email sent!</span>}
          {status === "error" && <span className="text-sm text-destructive">Failed to send</span>}
        </div>
        <Button onClick={handleSend} disabled={isLoading || status === "sending"}>
          <Send className="h-4 w-4 mr-2" />
          {status === "sending" ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
