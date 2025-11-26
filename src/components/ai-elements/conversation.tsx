"use client";
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Conversation({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-3', className)}>{children}</div>;
}

export function ConversationContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 space-y-3 overflow-auto">{children}</div>;
}

export function ConversationScrollButton() {
  return <div className="h-0" />; // minimal stub
}

