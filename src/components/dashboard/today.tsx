"use client";

import * as React from "react";
import { useMyBoardsSlim, useMyCalendar } from "@/hooks/api";
import { TaskRow } from "@/components/task-row";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// Daily AI Insights removed from Dashboard

type BoardTask = { id: string; title: string; descriptionMarkdown?: string | null; columnId: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null; estimatedPomodoros?: number | null; tags?: string[] | null; topics?: string[] | null; primaryTopic?: string | null; aiPlanned?: boolean | null; status?: string };

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function TodayMain({ filters }: { filters: { type?: 'deep' | 'shallow' | 'all', priority?: 'P1' | 'P2' | 'P3' | 'all', topic?: string | 'all' } }) {
  const boardsQ = useMyBoardsSlim();
  const calQ = useMyCalendar();
  const qc = useQueryClient();
  const [workWindow, setWorkWindow] = React.useState<{ start: number; end: number }>({ start: 9, end: 17 });

  // Load scheduler preferences to respect work hours in UI focus windows
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/scheduler/prefs');
        if (!res.ok) return;
        const data = await res.json();
        const start = Number(data?.prefs?.workStartHour ?? 9);
        const end = Number(data?.prefs?.workEndHour ?? 17);
        setWorkWindow({ start, end });
      } catch { /* noop */ }
    })();
  }, []);

  const tasks: BoardTask[] = React.useMemo(() => {
    if (!boardsQ.data?.boards) return [];
    const all: BoardTask[] = [];
    for (const b of boardsQ.data.boards) {
      for (const t of b.tasks) {
        all.push({
          id: t.id,
          title: t.title,
          descriptionMarkdown: t.descriptionMarkdown,
          columnId: t.columnId,
          priority: (t.priority as any) ?? null,
          estimatedPomodoros: (t.estimatedPomodoros as any) ?? null,
          tags: (t as any).tags ?? [],
          topics: (t as any).topics ?? null,
          primaryTopic: (t as any).primaryTopic ?? null,
          status: (t.status as any) ?? undefined,
        });
      }
    }
    return all;
  }, [boardsQ.data]);

  function matchFilters(t: BoardTask) {
    const type = filters.type ?? 'all';
    const pr = filters.priority ?? 'all';
    const topic = filters.topic ?? 'all';
    const isDeep = (t.tags || []).some(x => /deep/i.test(x));
    const isShallow = (t.tags || []).some(x => /shallow/i.test(x));
    if (type === 'deep' && !isDeep) return false;
    if (type === 'shallow' && !isShallow) return false;
    const p = t.priority === 'HIGH' ? 'P1' : t.priority === 'LOW' ? 'P3' : t.priority ? 'P2' : 'all';
    if (pr !== 'all' && p !== pr) return false;
    if (topic !== 'all') {
      const tops = t.topics || [];
      if (!(t.primaryTopic === topic || tops.includes(topic))) return false;
    }
    return true;
  }

  const upcoming = tasks.filter(t => (t.status === 'TODO' || !t.status) && matchFilters(t));

  // Upcoming events/meetings (next 7 days already filtered server-side). Show next 3.
  const nextEvents = React.useMemo(() => {
    const ev = (calQ.data?.events ?? []) as Array<{ id: string; title: string; startAt: string; endAt: string; type?: string }>;
    const meetings = (calQ.data?.meetings ?? []) as Array<{ id: string; title: string; startAt: string; endAt: string }>;
    const combined = [
      ...ev.map(e => ({ id: e.id, title: e.title, startAt: new Date(e.startAt), endAt: new Date(e.endAt), kind: e.type || 'FOCUS' })),
      ...meetings.map(m => ({ id: m.id, title: m.title, startAt: new Date(m.startAt), endAt: new Date(m.endAt), kind: 'MEETING' })),
    ];
    combined.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    // Deduplicate by kind+id+start time to avoid duplicate keys and visuals
    const seen = new Set<string>();
    const unique: Array<typeof combined[number] & { key: string }> = [];
    for (const item of combined) {
      const key = `${item.kind}:${item.id}:${item.startAt.getTime()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({ ...item, key });
    }
    return unique.slice(0, 3);
  }, [calQ.data]);

  // Compute free focus windows for TODAY from "now" to end-of-day
  const focusWindows = React.useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    // Cap focus windows to configured work day end
    endOfDay.setHours(workWindow.end, 0, 0, 0);

    const ev = (calQ.data?.events ?? []) as Array<{ id: string; title: string; startAt: string; endAt: string; type?: string }>;
    const meetings = (calQ.data?.meetings ?? []) as Array<{ id: string; title: string; startAt: string; endAt: string }>;
    const all = [
      ...ev.map(e => ({ id: e.id, startAt: new Date(e.startAt), endAt: new Date(e.endAt) })),
      ...meetings.map(m => ({ id: m.id, startAt: new Date(m.startAt), endAt: new Date(m.endAt) })),
    ].filter(x => x.endAt > startOfDay && x.startAt < endOfDay);
    all.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    const windows: { start: Date; end: Date }[] = [];
    let cursor = new Date(Math.max(now.getTime(), startOfDay.getTime()));
    for (const e of all) {
      if (e.startAt > cursor) {
        const gapStart = cursor;
        const gapEnd = new Date(Math.min(e.startAt.getTime(), endOfDay.getTime()));
        if (gapEnd.getTime() - gapStart.getTime() >= 20 * 60 * 1000) {
          windows.push({ start: new Date(gapStart), end: new Date(gapEnd) });
        }
      }
      if (e.endAt > cursor) cursor = new Date(e.endAt);
      if (cursor >= endOfDay) break;
    }
    if (cursor < endOfDay && endOfDay.getTime() - cursor.getTime() >= 20 * 60 * 1000) {
      windows.push({ start: new Date(cursor), end: new Date(endOfDay) });
    }
    return windows.slice(0, 3);
  }, [calQ.data, workWindow.end]);

  async function scheduleFocus25(windowStart: Date, windowEnd: Date) {
    const now = new Date();
    const start = new Date(Math.max(windowStart.getTime(), now.getTime()));
    const end = new Date(start.getTime() + 25 * 60 * 1000);
    if (end > windowEnd) {
      toast.error('Not enough time left in this window for a 25m block');
      return;
    }
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Focus block',
          type: 'FOCUS',
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          tags: ['focus'],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Scheduled 25m focus block');
      await qc.invalidateQueries({ queryKey: ['me', 'calendar'] });
    } catch (_e) {
      toast.error('Failed to schedule');
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Upcoming">
        {upcoming.length ? upcoming.map(t => (<TaskRow key={t.id} task={{ id: t.id, title: t.title, priority: t.priority ?? undefined, estimatedPomodoros: t.estimatedPomodoros ?? undefined, tags: t.tags ?? undefined }} />)) : (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Nothing upcoming.</CardContent></Card>
        )}
      </Section>
      <Section title="Focus Windows">
        {focusWindows.length ? focusWindows.map((w, idx) => {
          const mins = Math.round((w.end.getTime() - w.start.getTime()) / 60000);
          const can25 = mins >= 25;
          const startLabel = w.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endLabel = w.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <Card key={`${w.start.toISOString()}-${idx}`}>
              <CardContent className="p-3 text-sm flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="font-medium">{startLabel} – {endLabel}</span>
                  <span className="ml-2 text-muted-foreground">{mins} min free</span>
                </div>
                <Button size="sm" onClick={() => scheduleFocus25(w.start, w.end)} disabled={!can25}>
                  Schedule 25m block
                </Button>
              </CardContent>
            </Card>
          );
        }) : (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">No free windows today.</CardContent></Card>
        )}
      </Section>
      <Section title="Next Events">
        {nextEvents.length ? nextEvents.map(e => (
          <Card key={(e as any).key ?? `${e.kind}:${e.id}:${e.startAt.getTime()}`}>
            <CardContent className="p-3 text-sm flex items-center justify-between">
              <span className="truncate">{e.title}</span>
              <span className="text-muted-foreground">
                {e.startAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </CardContent>
          </Card>
        )) : (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">No upcoming events.</CardContent></Card>
        )}
      </Section>
    </div>
  );
}
