"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Inbox, Trash2, Check, X, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMailContext } from "@/lib/mail-context";
import { cn } from "@/lib/utils";
import { Email } from "@/lib/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-violet-500",
    "bg-fuchsia-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function EmailItem({
  email,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  email: Email;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { openEmail, trashEmail } = useMailContext();

  const handleRowClick = () => {
    if (selectionMode) {
      onToggleSelect(email.id);
    } else {
      openEmail(email.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    trashEmail(email.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRowClick();
    }
  };

  const senderName = email.from.includes("<")
    ? email.from.split("<")[0].trim().replace(/"/g, "")
    : email.from;

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(email.date), { addSuffix: false });
    // shorten "about X hours ago" → "Xh", etc.
    timeAgo = timeAgo
      .replace("about ", "")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" days", "d")
      .replace(" day", "d")
      .replace(" months", "mo")
      .replace(" month", "mo");
  } catch {
    timeAgo = email.date;
  }

  const initials = getInitials(senderName);
  const avatarColor = getAvatarColor(senderName);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative w-full text-left px-4 py-3.5 flex items-start gap-3.5 transition-all duration-150 cursor-pointer",
        "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selected ? "bg-primary/10" : !email.isRead ? "bg-accent/20" : "bg-transparent"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="shrink-0 mt-1.5">
          <div
            className={cn(
              "h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
              selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 bg-transparent"
            )}
          >
            {selected && <Check className="h-3.5 w-3.5" />}
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white tracking-wide",
            avatarColor
          )}
        >
          {initials}
        </div>
        {!email.isRead && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              !email.isRead ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
            )}
          >
            {senderName}
          </span>
          <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap tabular-nums shrink-0 group-hover:opacity-0 transition-opacity">
            {timeAgo}
          </span>
        </div>

        <p
          className={cn(
            "text-[13px] truncate leading-snug",
            !email.isRead ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {email.subject || "(no subject)"}
        </p>

        <p className="text-xs text-muted-foreground/60 truncate leading-relaxed">
          {email.snippet}
        </p>
      </div>

      {/* Hover delete button (hidden while selecting) */}
      {!selectionMode && (
        <button
          onClick={handleDelete}
          title="Move to Trash"
          className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmailList() {
  const { emails, isLoading, hasMore, loadMore, currentView, emptyTrashAll, trashByIds } = useMailContext();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const allSelected = emails.length > 0 && selectedIds.size === emails.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(emails.map((e) => e.id)));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    await trashByIds(Array.from(selectedIds));
    exitSelection();
  };

  if (isLoading && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Loading messages…</p>
      </div>
    );
  }

  if (!isLoading && emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6 text-center">
        <div className="rounded-2xl bg-muted p-4">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">All caught up</p>
          <p className="text-xs text-muted-foreground">No emails to show here.</p>
        </div>
      </div>
    );
  }

  const unreadCount = emails.filter((e) => !e.isRead).length;

  const handleEmptyTrash = async () => {
    if (window.confirm("Permanently delete ALL emails in Trash? This cannot be undone.")) {
      await emptyTrashAll();
    }
  };

  const folderLabel = currentView === "sent" ? "Sent" : currentView === "trash" ? "Trash" : "Inbox";

  return (
    <div className="flex flex-col h-full">
      {/* Selection action bar */}
      {selectionMode ? (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/40">
          <button
            onClick={toggleSelectAll}
            title={allSelected ? "Deselect all" : "Select all"}
            className={cn(
              "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
              allSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
            )}
          >
            {allSelected && <Check className="h-3.5 w-3.5" />}
          </button>
          <span className="text-xs font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive cursor-pointer hover:bg-destructive/10 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exitSelection}
            className="h-7 gap-1.5 text-xs cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      ) : (
        /* Normal header strip: folder · Select · unread */
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {folderLabel}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectionMode(true)}
            className="h-6 gap-1.5 text-[11px] px-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Select
          </Button>
          {currentView !== "trash" && unreadCount > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5 rounded-full">
              {unreadCount} unread
            </Badge>
          )}
          {currentView === "trash" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmptyTrash}
              className="ml-auto h-7 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Empty Trash
            </Button>
          )}
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/40">
          {emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              selectionMode={selectionMode}
              selected={selectedIds.has(email.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>

        {hasMore && (
          <div className="px-4 py-4 flex ml-7 border-t border-border/40 ">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={isLoading}
              className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5 bg-background/10 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading…
                </>
              ) : (
                "Show more messages"
              )}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}