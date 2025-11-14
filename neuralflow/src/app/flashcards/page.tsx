"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

type Deck = { id: string; title: string; cards: number; createdAt: string };

export default function FlashcardsPage() {
  const { data, isLoading } = useQuery<Deck[]>({
    queryKey: ['flashcards'],
    queryFn: async () => (await (await fetch('/api/learn/decks')).json()) as Deck[],
  });
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Flashcards</h1>
      {isLoading ? <div>Loading…</div> : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map(d => (
          <Link key={d.id} href={`/learn/decks/${d.id}`} className="rounded-xl border p-4 hover:border-primary/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-sm text-muted-foreground">{d.cards} cards</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
