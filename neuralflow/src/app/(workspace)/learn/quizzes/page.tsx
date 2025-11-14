"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type Quiz = { id: string; title: string; questions: number; createdAt: string };

export default function QuizzesPage() {
  const { data, isLoading } = useQuery<Quiz[]>({
    queryKey: ["learn", "quizzes"],
    queryFn: async () => (await (await fetch("/api/learn/quizzes")).json()) as Quiz[],
    staleTime: 5000,
  });

  return (
    <main>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quizzes</h1>
          <p className="text-sm text-muted-foreground">Quick checks for understanding.</p>
        </div>
      </div>
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
        {(data?.length ?? 0) === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No quizzes yet</div>
        )}
      </div>
    </main>
  );
}

