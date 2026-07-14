"use client";

import { Inbox, Send, PenSquare, LogOut, Sun, Moon, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMailContext } from "@/lib/mail-context";
import { useTheme } from "@/lib/theme-context";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { currentView, fetchInbox, fetchSent, openCompose, setFilter } = useMailContext();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  const handleNav = (fn: () => void) => {
    fn();
    onClose?.();
  };

  return (
    <aside className="w-60 border-r border-border bg-muted/30 flex flex-col h-full">
      <div className="p-4 flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground flex-1">AI Mailer</h1>
        {/* Close button — mobile only */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 mb-4">
        <Button
          className="w-full justify-start gap-2 cursor-pointer"
          onClick={() => handleNav(openCompose)}
        >
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <Button
          variant={currentView === "inbox" ? "secondary" : "ghost"}
          className={cn("w-full justify-start gap-2 cursor-pointer")}
          onClick={() => handleNav(() => { setFilter({}); fetchInbox({}); })}
        >
          <Inbox className="h-4 w-4" />
          Inbox
        </Button>
        <Button
          variant={currentView === "sent" ? "secondary" : "ghost"}
          className={cn("w-full justify-start gap-2 cursor-pointer")}
          onClick={() => handleNav(() => { setFilter({}); fetchSent({}); })}
        >
          <Send className="h-4 w-4" />
          Sent
        </Button>
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        {session?.user?.email && (
          <p className="text-xs text-muted-foreground truncate px-3 mb-2">{session.user.email}</p>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-full justify-start gap-2 text-muted-foreground cursor-pointer"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
