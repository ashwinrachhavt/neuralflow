"use client";

import * as React from "react";
import { useMyOverview } from "@/hooks/api";
import { TaskRow } from "@/components/task-row";
import { Card, CardContent } from "@/components/ui/card";

type BoardTask = { id: string; title: string; descriptionMarkdown?: string | null; columnId: string; priority?: 'LOW'|'MEDIUM'|'HIGH'|null; estimatedPomodoros?: number|null; tags?: string[]|null; aiPlanned?: boolean|null; status?: string };

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function TodayMain({ filters }: { filters: { type?: 'deep'|'shallow'|'all', priority?: 'P1'|'P2'|'P3'|'all' } }) {
  const { data } = useMyOverview();

  const tasks: BoardTask[] = React.useMemo(() => {
    if (!data?.boards) return [];
    const all: BoardTask[] = [];
    for (const b of data.boards) {
      for (const t of b.tasks) {
        all.push({
          id: t.id,
          title: t.title,
          descriptionMarkdown: t.descriptionMarkdown,
          columnId: t.columnId,
          priority: (t.priority as any) ?? null,
          estimatedPomodoros: (t.estimatedPomodoros as any) ?? null,
          tags: (t as any).tags ?? [],
          status: (t.status as any) ?? undefined,
        });
      }
    }
    return all;
  }, [data]);

  function matchFilters(t: BoardTask) {
    const type = filters.type ?? 'all';
    const pr = filters.priority ?? 'all';
    const isDeep = (t.tags || []).some(x => /deep/i.test(x));
    const isShallow = (t.tags || []).some(x => /shallow/i.test(x));
    if (type === 'deep' && !isDeep) return false;
    if (type === 'shallow' && !isShallow) return false;
    const p = t.priority === 'HIGH' ? 'P1' : t.priority === 'LOW' ? 'P3' : t.priority ? 'P2' : 'all';
    if (pr !== 'all' && p !== pr) return false;
    return true;
  }

  const upcoming = tasks.filter(t => (t.status === 'TODO' || !t.status) && matchFilters(t));

  // Upcoming events/meetings (next 7 days already filtered server-side). Show next 3.
  const nextEvents = React.useMemo(() => {
    const ev = (data?.calendar?.events ?? []) as Array<{ id: string; title: string; startAt: string; endAt: string; type?: string } >;
    const meetings = (data?.calendar?.meetings ?? []) as Array<{ id: string; title: string; startAt: string; endAt: string }>;
    const all = [
      ...ev.map(e => ({ id: e.id, title: e.title, startAt: new Date(e.startAt), endAt: new Date(e.endAt), kind: e.type || 'FOCUS' })),
      ...meetings.map(m => ({ id: m.id, title: m.title, startAt: new Date(m.startAt), endAt: new Date(m.endAt), kind: 'MEETING' })),
    ];
    all.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    return all.slice(0, 3);
  }, [data]);

  return (
    <div className="space-y-6">
      <Section title="Upcoming">
        {upcoming.length ? upcoming.map(t => (<TaskRow key={t.id} task={{ id: t.id, title: t.title, priority: t.priority ?? undefined, estimatedPomodoros: t.estimatedPomodoros ?? undefined, tags: t.tags ?? undefined }} />)) : (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Nothing upcoming.</CardContent></Card>
        )}
      </Section>
      <Section title="Next Events">
        {nextEvents.length ? nextEvents.map(e => (
          <Card key={e.id}>
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
