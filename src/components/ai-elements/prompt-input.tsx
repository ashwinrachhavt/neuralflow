"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PromptInput({ onSubmit, className, children }: { onSubmit: (message: { text?: string }) => void; className?: string; children?: React.ReactNode }) {
  const [text, setText] = React.useState('');
  function handle() {
    const t = text.trim(); if (!t) return; onSubmit({ text: t }); setText('');
  }
  return (
    <div className={cn('rounded-md border p-2', className)}>
      {children}
      <div className="flex items-center gap-2">
        <PromptInputTextarea value={text} onChange={(e)=>setText(e.target.value)} />
        <PromptInputSubmit onClick={handle} />
      </div>
    </div>
  );
}

export function PromptInputHeader({ children }: { children: React.ReactNode }) { return <div className="mb-2">{children}</div>; }
export function PromptInputBody({ children }: { children: React.ReactNode }) { return <div className="mb-2">{children}</div>; }
export function PromptInputFooter({ children }: { children: React.ReactNode }) { return <div className="mt-2">{children}</div>; }
export function PromptInputTools({ children }: { children: React.ReactNode }) { return <div className="flex items-center gap-2">{children}</div>; }

export function PromptInputTextarea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      className={cn(
        "flex-1 w-full min-h-[72px] md:min-h-[104px] rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-sm leading-6 resize-y shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-foreground/20 placeholder:text-muted-foreground/60",
        className,
      )}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder ?? "Write your message… Enter to send • Shift+Enter for newline"}
    />
  );
}

export function PromptInputSubmit({ onClick, disabled, status }: { onClick: () => void; disabled?: boolean; status?: any }) {
  return <Button size="sm" onClick={onClick} disabled={disabled}>{status === 'submitting' ? '…' : 'Send'}</Button>;
}
