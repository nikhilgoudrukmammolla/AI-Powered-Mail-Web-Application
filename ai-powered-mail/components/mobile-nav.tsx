"use client";

import { useState, useRef, useEffect } from "react";
import { Inbox, Send, PenSquare, MoreVertical, LogOut, Sun, Moon, Trash2 } from "lucide-react";
import { useMailContext } from "@/lib/mail-context";
import { useTheme } from "@/lib/theme-context";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onMenuOpen?: () => void;
}

export function MobileNav({ onMenuOpen }: MobileNavProps) {
  const { currentView, fetchInbox, fetchSent, fetchTrash, openCompose, setFilter } = useMailContext();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const [dropUpOpen, setDropUpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close drop-up when clicking outside
  useEffect(() => {
    if (!dropUpOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropUpOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropUpOpen]);

  return (
    <>
      {/* Drop-up overlay backdrop */}
      {dropUpOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDropUpOpen(false)}
        />
      )}

      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur-sm h-16 flex items-stretch">

        {/* Inbox */}
        <button
          onClick={() => { setFilter({}); fetchInbox({}); }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            currentView === "inbox" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Inbox className="h-5 w-5" />
          <span className="text-[10px]">Inbox</span>
        </button>

        {/* Compose */}
        <button
          onClick={() => openCompose()}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            currentView === "compose" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PenSquare className="h-5 w-5" />
          <span className="text-[10px]">Compose</span>
        </button>

        {/* Sent */}
        <button
          onClick={() => { setFilter({}); fetchSent({}); }}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            currentView === "sent" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Send className="h-5 w-5" />
          <span className="text-[10px]">Sent</span>
        </button>

        {/* Menu — right end, drop-up */}
        <div ref={menuRef} className="relative flex items-stretch">
          <button
            onClick={() => setDropUpOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 transition-colors",
              dropUpOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreVertical className="h-5 w-5" />
            <span className="text-[10px]">More</span>
          </button>

          {/* Drop-up panel */}
          {dropUpOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden">
              {/* Email address */}
              {session?.user?.email && (
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
              )}

              {/* Trash */}
              <button
                onClick={() => { setFilter({}); fetchTrash({}); setDropUpOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60 transition-colors",
                  currentView === "trash" ? "text-primary" : "text-foreground"
                )}
              >
                <Trash2 className="h-4 w-4" />
                Trash
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => { toggleTheme(); setDropUpOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/60 transition-colors border-t border-border"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              {/* Sign out */}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-muted/60 transition-colors border-t border-border"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
