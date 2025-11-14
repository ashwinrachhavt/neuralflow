"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useBoards, useCreateBoard } from '@/hooks/api';

export default function BoardsIndex() {
  const { data } = useBoards();
  const createBoard = useCreateBoard();
  const [title, setTitle] = useState('');
  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Boards</h1>
          <p className="text-sm text-muted-foreground">Switch or create boards.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = title.trim();
            if (!v) return;
            createBoard.mutate({ title: v });
            setTitle('');
          }}
        >
          <input className="rounded border px-2 py-1 text-sm" placeholder="New board title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="rounded border px-3 py-1 text-sm" type="submit" disabled={createBoard.isPending}>Create</button>
        </form>
      </div>
      <ul className="space-y-2">
        {(data ?? []).map(b => (
          <li key={b.id} className="flex items-center justify-between rounded border p-3">
            <Link href={`/boards/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
          </li>
        ))}
        {(data?.length ?? 0) === 0 && (
          <li className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">No boards yet</li>
        )}
      </ul>
    </main>
  );
}
