"use client";

import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

type NoteDetail = { id: string; title: string; contentJson: string; contentMarkdown: string; updatedAt: string };

export default function NoteDetailPage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { data, isLoading } = useQuery<NoteDetail>({
    queryKey: ['note', noteId],
    queryFn: async () => (await (await fetch(`/api/notes/${noteId}`)).json()) as NoteDetail,
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      {isLoading ? <div>Loading…</div> : null}
      {data ? (
        <div>
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          <p className="mb-4 text-xs text-muted-foreground">Updated {new Date(data.updatedAt).toLocaleString()}</p>
          <pre className="whitespace-pre-wrap rounded border p-4 text-sm bg-background/60">{data.contentMarkdown}</pre>
        </div>
      ) : null}
    </main>
  );
}
