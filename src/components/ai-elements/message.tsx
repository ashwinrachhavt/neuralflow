"use client";
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Message({ children, from }: { children: React.ReactNode; from: 'user' | 'assistant' }) {
  const isAssistant = from === 'assistant';
  return (
    <div className={cn('rounded-md border p-3 text-sm', isAssistant ? 'bg-card/70' : 'bg-muted/40')}>{children}</div>
  );
}

export function MessageContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function MessageResponse({ children }: { children: React.ReactNode }) {
  return <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{children}</div>;
}

export function MessageActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 flex items-center gap-2">{children}</div>;
}

export function MessageAction({ onClick, label, children }: { onClick: () => void; label: string; children?: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label} className="rounded border px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
      {children || label}
    </button>
  );
}

