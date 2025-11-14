"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type LearnResponse = {
  decks: { id: string; title: string; cards: number; createdAt: string }[];
  quizzes: { id: string; title: string; questions: number; createdAt: string }[];
};

export default function LearnPage() {
  const { data } = useQuery<LearnResponse>({
    queryKey: ["learn"],
    queryFn: async () => (await (await fetch("/api/learn")).json()) as LearnResponse,
    staleTime: 5000,
  });

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review flashcards and quizzes generated from your notes.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/learn/decks" className="rounded-xl border p-6 hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Flashcard Decks</h2>
              <p className="text-sm text-muted-foreground">Spaced recall for key ideas.</p>
            </div>
            <span className="text-sm text-muted-foreground">{data?.decks.length ?? 0}</span>
          </div>
        </Link>
        <Link href="/learn/quizzes" className="rounded-xl border p-6 hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Quizzes</h2>
              <p className="text-sm text-muted-foreground">Quick checks for understanding.</p>
            </div>
            <span className="text-sm text-muted-foreground">{data?.quizzes.length ?? 0}</span>
          </div>
        </Link>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Decks</h3>
          <ul className="space-y-2">
            {(data?.decks ?? []).slice(0, 5).map(d => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                <Link href={`/learn/decks/${d.id}`} className="font-medium hover:underline">{d.title}</Link>
                <span className="text-xs text-muted-foreground">{d.cards} cards</span>
              </li>
            ))}
            {(data?.decks?.length ?? 0) === 0 && (
              <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No decks yet — generate a quiz from a note to create decks.</li>
            )}
          </ul>
        </section>
        <section>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent Quizzes</h3>
          <ul className="space-y-2">
            {(data?.quizzes ?? []).slice(0, 5).map(q => (
              <li key={q.id} className="flex items-center justify-between rounded-lg border p-3">
                <Link href={`/learn/quizzes/${q.id}`} className="font-medium hover:underline">{q.title}</Link>
                <span className="text-xs text-muted-foreground">{q.questions} questions</span>
              </li>
            ))}
            {(data?.quizzes?.length ?? 0) === 0 && (
              <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No quizzes yet — create one from a note via the Todo/Kanban actions.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
