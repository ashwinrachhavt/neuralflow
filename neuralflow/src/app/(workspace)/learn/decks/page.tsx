"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

type Deck = { id: string; title: string; cards: number; createdAt: string };

export default function DecksPage() {
  const { data, isLoading } = useQuery<Deck[]>({
    queryKey: ["learn", "decks"],
    queryFn: async () => (await (await fetch("/api/learn/decks")).json()) as Deck[],
    staleTime: 5000,
  });

  return (
    <main>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Flashcard Decks</h1>
          <p className="text-sm text-muted-foreground">Quick recall for the essentials.</p>
        </div>
      </div>
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
        {(data?.length ?? 0) === 0 && !isLoading && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No decks yet</div>
        )}
      </div>
    </main>
  );
}

