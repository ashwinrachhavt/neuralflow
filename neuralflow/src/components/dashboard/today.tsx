"use client";

import * as React from "react";
import { useDefaultBoardId, useBoard } from "@/hooks/api";
import { TaskRow } from "@/components/task-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const { data: def } = useDefaultBoardId();
  const boardId = def?.id ?? "";
  const { data } = useBoard(boardId);

  const tasks: BoardTask[] = React.useMemo(() => {
    const map = (data as any)?.board?.tasks ?? {};
    return Object.values(map) as BoardTask[];
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

  const planned = tasks.filter(t => t.aiPlanned && t.status !== 'DONE' && matchFilters(t));
  const upcoming = tasks.filter(t => !t.aiPlanned && (t.status === 'TODO' || !t.status) && matchFilters(t));

  return (
    <div className="space-y-6">
      <Section title="AI Planned">
        {planned.length ? planned.map(t => (<TaskRow key={t.id} task={{ id: t.id, title: t.title, priority: t.priority ?? undefined, estimatedPomodoros: t.estimatedPomodoros ?? undefined, tags: t.tags ?? undefined }} />)) : (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">No AI planned tasks yet.</CardContent></Card>
        )}
      </Section>
      <Section title="Upcoming">
        {upcoming.length ? upcoming.map(t => (<TaskRow key={t.id} task={{ id: t.id, title: t.title, priority: t.priority ?? undefined, estimatedPomodoros: t.estimatedPomodoros ?? undefined, tags: t.tags ?? undefined }} />)) : (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Nothing upcoming.</CardContent></Card>
        )}
      </Section>
    </div>
  );
}

