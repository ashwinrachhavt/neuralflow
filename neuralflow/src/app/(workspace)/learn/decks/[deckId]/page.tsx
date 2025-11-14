"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

type DeckDetail = {
  id: string;
  title: string;
  createdAt: string;
  cards: { id: string; question: string; answer: string }[];
};

export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = params.deckId;
  const { data, isLoading } = useQuery<DeckDetail>({
    queryKey: ["deck", deckId],
    queryFn: async () => (await (await fetch(`/api/learn/decks/${deckId}`)).json()) as DeckDetail,
  });

  return (
    <main>
      {isLoading ? <div>Loading…</div> : null}
      {data ? (
        <div>
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{new Date(data.createdAt).toLocaleString()}</p>
          <ul className="space-y-3">
            {data.cards.map(c => (
              <li key={c.id} className="rounded-lg border p-4">
                <p className="font-medium">{c.question}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.answer}</p>
              </li>
            ))}
            {data.cards.length === 0 && (
              <li className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No cards in this deck yet</li>
            )}
          </ul>
        </div>
      ) : null}
    </main>
  );
}

