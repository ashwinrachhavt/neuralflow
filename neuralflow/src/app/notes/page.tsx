"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

type Note = { id: string; title: string; updatedAt: string };

export default function NotesPage() {
  const { data, isLoading } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: async () => (await (await fetch('/api/notes')).json()) as Note[],
  });
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Notes</h1>
      {isLoading ? <div>Loading…</div> : null}
      <ul className="space-y-2">
        {(data ?? []).map(n => (
          <li key={n.id} className="flex items-center justify-between rounded border p-3">
            <Link href={`/notes/${n.id}`} className="font-medium hover:underline">{n.title}</Link>
            <span className="text-xs text-muted-foreground">{new Date(n.updatedAt).toLocaleString()}</span>
          </li>
        ))}
        {(data?.length ?? 0) === 0 && !isLoading && (
          <li className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">No notes yet</li>
        )}
      </ul>
    </main>
  );
}
