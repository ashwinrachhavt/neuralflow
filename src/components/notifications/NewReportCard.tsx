"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ReportItem = { id: string; createdAt: string; summary: string; highlights?: string[]; sentiment?: string };

export function NewReportCard() {
  const [item, setItem] = React.useState<ReportItem | null>(null);
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/reports/weekly/list', { cache: 'no-store' });
        const data = await res.json().catch(() => ({ items: [] }));
        const latest: ReportItem | undefined = Array.isArray(data.items) ? data.items[0] : undefined;
        if (!latest) return;
        // Hide if dismissed
        const dismissed = typeof window !== 'undefined' ? localStorage.getItem('report-notif-dismissed') : null;
        if (dismissed && dismissed === latest.id) return;
        if (active) setItem(latest);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  if (!item || hidden) return null;

  const when = new Date(item.createdAt);
  const dateLabel = when.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">New weekly report</CardTitle>
        <div className="text-xs text-muted-foreground">{dateLabel}</div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm line-clamp-3">{item.summary}</p>
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={() => { window.location.href = '/reports'; }}>
            View report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              try { localStorage.setItem('report-notif-dismissed', item.id); } catch { /* ignore */ }
              setHidden(true);
            }}
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

