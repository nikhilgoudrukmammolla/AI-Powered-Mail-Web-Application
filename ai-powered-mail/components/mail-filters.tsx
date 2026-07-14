"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMailContext } from "@/lib/mail-context";

export function MailFilters() {
  const { filter, setFilter, fetchInbox, fetchSent, currentView } = useMailContext();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filter.query || "");
  const [fromFilter, setFromFilter] = useState(filter.from || "");
  const [afterDate, setAfterDate] = useState(filter.after || "");
  const [beforeDate, setBeforeDate] = useState(filter.before || "");
  const [unreadOnly, setUnreadOnly] = useState(filter.isUnread || false);

  const applyFilters = () => {
    const newFilter = {
      query: searchQuery || undefined,
      from: fromFilter || undefined,
      after: afterDate || undefined,
      before: beforeDate || undefined,
      isUnread: unreadOnly || undefined,
    };
    setFilter(newFilter);
    if (currentView === "sent") {
      fetchSent(newFilter);
    } else {
      fetchInbox(newFilter);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFromFilter("");
    setAfterDate("");
    setBeforeDate("");
    setUnreadOnly(false);
    setFilter({});
    if (currentView === "sent") {
      fetchSent({});
    } else {
      fetchInbox({});
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  return (
    <div className="border-b border-border">
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 p-2 sm:p-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm" className="shrink-0">Search</Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {showFilters && (
        <div className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                value={fromFilter}
                onChange={(e) => setFromFilter(e.target.value)}
                placeholder="sender@email.com"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">After date</label>
              <Input
                type="date"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Before date</label>
              <Input
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="rounded"
                />
                Unread only
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
