"use client";

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PromptInputTextarea } from '@/components/ai-elements/prompt-input';
import { toast } from 'sonner';

type Learning = { id: string; summary: string; details?: any; tags?: string[]; confidence?: number | null; createdAt: string };

export function CardLearnings({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery<{ learnings: Learning[] }>({ queryKey: ['task', taskId, 'learnings'], queryFn: async () => {
    const res = await fetch(`/api/tasks/${taskId}/learning`);
    if (!res.ok) throw new Error('Failed to load');
    return res.json();
  }, staleTime: 5000 });
  const items = data?.learnings || [];

  const [text, setText] = React.useState('');
  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/learning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: text }) });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: async () => {
      setText('');
      toast.success('Logged learning');
      await qc.invalidateQueries({ queryKey: ['task', taskId, 'learnings'] });
    },
    onError: (e:any) => toast.error(e?.message || 'Failed'),
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (text.trim()) add.mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Learnings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <PromptInputTextarea value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={onKeyDown} placeholder="What did you learn? Enter to save • Shift+Enter for newline" />
          <div className="mt-2 flex justify-end"><Button size="sm" onClick={()=>text.trim() && add.mutate()} disabled={!text.trim() || add.isPending}>{add.isPending ? 'Saving…' : 'Save'}</Button></div>
        </div>
        {items.length === 0 ? (
          <div className="text-xs text-muted-foreground">No learnings yet.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((l) => (
              <li key={l.id} className="rounded-md border border-border/60 bg-card/70 p-2">
                <div className="text-sm">{l.summary}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

