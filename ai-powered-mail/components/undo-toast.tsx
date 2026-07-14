"use client";

import { useEffect, useState } from "react";
import { RotateCcw, X, Trash2 } from "lucide-react";
import { useMailContext } from "@/lib/mail-context";

export function UndoToast() {
  const { lastDeleted, undoDelete, clearLastDeleted } = useMailContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastDeleted && !lastDeleted.permanent && lastDeleted.ids.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        clearLastDeleted();
      }, 8000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [lastDeleted, clearLastDeleted]);

  if (!visible || !lastDeleted) return null;

  const count = lastDeleted.ids.length;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card shadow-xl px-4 py-3">
        <Trash2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground flex-1 truncate">
          {count === 1 ? "Email moved to Trash" : `${count} emails moved to Trash`}
        </span>
        <button
          onClick={async () => {
            await undoDelete();
            setVisible(false);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Undo
        </button>
        <button
          onClick={() => {
            setVisible(false);
            clearLastDeleted();
          }}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
