"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Suggestion =
  | { id: string; kind: 'GYM_REMINDER'; title: string; startAt: string; endAt: string }
  | { id: string; kind: 'FOCUS_SESSION'; title: string; startAt: string; endAt: string; topic?: string }
  | { id: string; kind: 'SHALLOW_SESSION'; title: string; startAt: string; endAt: string; topic?: string }
  | { id: string; kind: 'LOG_HOURS'; title: string; startAt: string; endAt: string; project?: string };

export function SmartSuggestions() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery<{ suggestions: Suggestion[] }>({ queryKey: ['scheduler','suggestions'], queryFn: async () => {
    const res = await fetch('/api/scheduler/suggestions');
    if (!res.ok) throw new Error('Failed suggestions');
    return res.json();
  }, staleTime: 20_000 });
  const [local, setLocal] = React.useState<Suggestion[]>([]);
  React.useEffect(() => { if (data?.suggestions) setLocal(data.suggestions); }, [data?.suggestions]);

  async function accept(s: Suggestion) {
    try {
      const isFocus = s.kind === 'FOCUS_SESSION' || s.kind === 'SHALLOW_SESSION';
      const isLog = s.kind === 'LOG_HOURS';
      const eventType = isFocus ? 'FOCUS' : 'PERSONAL';
      const tags = [] as string[];
      if ('topic' in s && s.topic) tags.push(s.topic);
      if (isLog) tags.push('log','vibe');
      const res = await fetch('/api/calendar/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: s.title, type: eventType, startAt: s.startAt, endAt: s.endAt, tags }),
      });
      if (!res.ok) throw new Error('Failed to schedule');
      setLocal(prev => prev.filter(x => x.id !== s.id));
      toast.success('Scheduled');
      await qc.invalidateQueries({ queryKey: ['me','calendar'] });
    } catch (e:any) {
      toast.error(e.message || 'Failed');
    }
  }

  function dismiss(id: string) { setLocal(prev => prev.filter(x => x.id !== id)); }

  if (isLoading) return null;
  if (!local.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {local.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card/70 p-3 text-sm">
            <div>
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-muted-foreground">{new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(s.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => accept(s)}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => dismiss(s.id)}>Dismiss</Button>
            </div>
          </div>
        ))}
        <div className="pt-1">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh</Button>
        </div>
      </CardContent>
    </Card>
  );
}
