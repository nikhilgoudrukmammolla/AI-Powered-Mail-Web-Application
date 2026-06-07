"use client";

import { Inbox, Send, PenSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMailContext } from "@/lib/mail-context";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { currentView, fetchInbox, fetchSent, openCompose, setFilter } = useMailContext();

  return (
    <aside className="w-60 border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-lg font-bold text-foreground">AI Mail</h1>
      </div>

      <div className="px-3 mb-4">
        <Button
          className="w-full justify-start gap-2"
          onClick={() => openCompose()}
        >
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <Button
          variant={currentView === "inbox" ? "secondary" : "ghost"}
          className={cn("w-full justify-start gap-2")}
          onClick={() => { setFilter({}); fetchInbox({}); }}
        >
          <Inbox className="h-4 w-4" />
          Inbox
        </Button>
        <Button
          variant={currentView === "sent" ? "secondary" : "ghost"}
          className={cn("w-full justify-start gap-2")}
          onClick={() => { setFilter({}); fetchSent({}); }}
        >
          <Send className="h-4 w-4" />
          Sent
        </Button>
      </nav>

      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
