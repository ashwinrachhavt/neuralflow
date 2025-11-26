"use client";

import * as React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReportItem = { id: string; createdAt: string; summary: string };

export function NotificationsBell() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<ReportItem[]>([]);
  const [hasNew, setHasNew] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/reports/weekly/list', { cache: 'no-store' });
        const data = await res.json().catch(() => ({ items: [] }));
        const arr = Array.isArray(data.items) ? data.items.slice(0, 3) : [];
        setItems(arr);
        const dismissed = typeof window !== 'undefined' ? localStorage.getItem('report-notif-dismissed') : null;
        if (arr[0] && arr[0].id !== dismissed) setHasNew(true);
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="relative">
      <button
        className={cn('relative rounded-full p-2 hover:bg-foreground/10 transition', open && 'bg-foreground/10')}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {hasNew && <span className="absolute -right-0.5 -top-0.5 inline-block size-2 rounded-full bg-primary" />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-card p-3 shadow-xl">
          <div className="mb-2 text-sm font-medium">Notifications</div>
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground">No notifications</div>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="rounded-md border p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">Weekly report</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(it.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.summary}</div>
                  <div className="mt-2 text-right">
                    <a href="/reports" className="text-xs underline underline-offset-4">View</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

