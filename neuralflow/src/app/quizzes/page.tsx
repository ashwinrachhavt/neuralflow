"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

type Quiz = { id: string; title: string; questions: number; createdAt: string };

export default function QuizzesIndexPage() {
  const { data, isLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes'],
    queryFn: async () => (await (await fetch('/api/learn/quizzes')).json()) as Quiz[],
  });
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Quizzes</h1>
      {isLoading ? <div>Loading…</div> : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map(q => (
          <Link key={q.id} href={`/learn/quizzes/${q.id}`} className="rounded-xl border p-4 hover:border-primary/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{q.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-sm text-muted-foreground">{q.questions} questions</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
