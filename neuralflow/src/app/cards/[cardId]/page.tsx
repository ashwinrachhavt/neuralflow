"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

type TaskDetail = { task: { id: string; title: string; descriptionMarkdown: string }; note?: { id: string; contentMarkdown: string } | null };

export default function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const { data, isLoading } = useQuery<TaskDetail>({
    queryKey: ['card', cardId],
    queryFn: async () => {
      const res = await fetch(`/api/cards/${cardId}`);
      if (!res.ok) throw new Error('Failed to load card');
      return (await res.json()) as TaskDetail;
    },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      {isLoading ? <div>Loading…</div> : null}
      {data ? (
        <div>
          <h1 className="text-2xl font-semibold">{data.task.title}</h1>
          {data.task.descriptionMarkdown ? (
            <pre className="mt-4 whitespace-pre-wrap rounded border p-4 text-sm">{data.task.descriptionMarkdown}</pre>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No description yet. Use Enrich from the board or Todos.</p>
          )}
          {data.note ? (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-muted-foreground">Note</h2>
              <pre className="mt-2 whitespace-pre-wrap rounded border p-3 text-xs bg-background/60">{data.note.contentMarkdown}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
