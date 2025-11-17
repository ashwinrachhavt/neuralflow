'use client';

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function Msg({ role, content }: { role: string; content: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-3">
      <div className="mb-1 text-[10px] uppercase text-muted-foreground">{role}</div>
      <div className="whitespace-pre-wrap text-sm">{content}</div>
    </div>
  );
}

export default function QuickChatPage() {
  const [web, setWeb] = React.useState(false);
  const [model, setModel] = React.useState('gpt-4.1-mini');
  const [text, setText] = React.useState('');
  const { messages, sendMessage, isLoading, reload } = useChat({ api: '/api/quickchat' });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Quick Chat</h1>
      <p className="mb-4 text-sm text-muted-foreground">Ask anything. Toggle web to fetch DuckDuckGo results and include citations.</p>

      <div className="mb-3 flex gap-2 text-sm">
        <Button variant={web ? 'default' : 'outline'} size="sm" onClick={() => setWeb((v) => !v)}>
          {web ? 'Web: On' : 'Web: Off'}
        </Button>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded border bg-background px-2 py-1 text-sm">
          <option value="gpt-4.1-mini">OpenAI: GPT‑4.1‑mini</option>
          <option value="gpt-4o-mini">OpenAI: GPT‑4o‑mini</option>
        </select>
        {messages.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => reload()}>Retry</Button>
        ) : null}
      </div>

      <div className="space-y-2">
        {messages.map((m) => (
          <Msg key={m.id} role={m.role} content={(m.content as any) ?? ''} />
        ))}
        {isLoading ? (
          <Card><CardContent className="p-3 text-sm text-muted-foreground">Thinking…</CardContent></Card>
        ) : null}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const q = text.trim();
          if (!q) return;
          await sendMessage({ text: q }, { body: { webSearch: web, model } });
          setText('');
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText((e.target as HTMLInputElement).value)}
          placeholder="Ask a question…"
          className="flex-1 rounded border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={!text.trim() || isLoading}>Send</Button>
      </form>
    </main>
  );
}
