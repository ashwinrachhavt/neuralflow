"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
    <PageShell size="sm">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}
      {data ? (
        <div className="space-y-4">
          <SectionHeader title={data.task.title} />
          <Card>
            <CardContent className="p-4">
              {data.task.descriptionMarkdown ? (
                <pre className="whitespace-pre-wrap text-sm">{data.task.descriptionMarkdown}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">No description yet. Use Enrich from the board or Todos.</p>
              )}
            </CardContent>
          </Card>
          {data.note ? (
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-1 text-sm font-medium text-muted-foreground">Note</h2>
                <pre className="whitespace-pre-wrap text-xs text-foreground/90">{data.note.contentMarkdown}</pre>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}
