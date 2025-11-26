"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModelSelector } from '@/components/ai-elements/model-selector';
import { Loader2 } from 'lucide-react';

type Msg = { role: 'user'|'assistant'; content: string };

type CardChatContext = {
  title: string;
  descriptionMarkdown?: string | null;
  primaryTopic?: string | null;
  topics?: string[] | null;
  projectTitle?: string | null;
  columnTitle?: string | null;
};

export function CardChat({ taskId, cardContext }: { taskId: string; cardContext?: CardChatContext }) {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [model, setModel] = React.useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('card-chat-model') || 'gpt-5.1';
    return 'gpt-5.1';
  });

  async function send() {
    const content = input.trim();
    if (!content) return;
    const next = [...messages, { role: 'user', content } as Msg];
    setMessages(next);
    setInput('');
    setPending(true);
    try {
      const res = await fetch(`/api/ai/cards/${taskId}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, model }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: String(data?.reply ?? '') }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hmm, I cannot reply right now.' }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Context summary */}
      {cardContext ? (
        <div className="rounded-md border border-border/50 bg-card/50 p-3 text-xs">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {cardContext.projectTitle ? (
              <span className="rounded px-2 py-0.5 bg-muted">{cardContext.projectTitle}</span>
            ) : null}
            {cardContext.columnTitle ? (
              <span className="rounded px-2 py-0.5 bg-muted">{cardContext.columnTitle}</span>
            ) : null}
            {cardContext.primaryTopic ? (
              <span className="rounded px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{cardContext.primaryTopic}</span>
            ) : null}
            {(cardContext.topics || []).filter(t => t !== cardContext.primaryTopic).slice(0, 2).map((t) => (
              <span key={t} className="rounded px-2 py-0.5 bg-muted text-foreground/80">{t}</span>
            ))}
          </div>
          {cardContext.descriptionMarkdown ? (
            <p className="line-clamp-3 text-muted-foreground">{cardContext.descriptionMarkdown}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <ModelSelector value={model} onChange={(v) => { setModel(v); try { localStorage.setItem('card-chat-model', v); } catch { /* ignore */ } }} />
      </div>
      <div className="max-h-[280px] overflow-auto rounded-md border border-border/50 bg-card/50 p-3 text-sm">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ask me to refine the task, create a plan, or summarize context.</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m, i) => (
              <li key={i} className={m.role === 'assistant' ? 'text-foreground' : 'text-muted-foreground'}>
                <span className="text-[10px] uppercase tracking-wider mr-2 opacity-60">{m.role}</span>
                <span>{m.content}</span>
              </li>
            ))}
            {pending ? (
              <li className="text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> thinking…</li>
            ) : null}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Chat with this card…" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />
        <Button size="sm" onClick={() => send()} disabled={pending || !input.trim()}>{pending ? <Loader2 className="size-4 animate-spin" /> : 'Send'}</Button>
      </div>
    </div>
  );
}
