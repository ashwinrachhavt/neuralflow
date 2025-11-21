"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function Msg({ role, content }: { role: string; content: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-3">
      <div className="mb-1 text-[10px] uppercase text-muted-foreground">{role}</div>
      <div className="whitespace-pre-wrap text-sm">{content}</div>
    </div>
  );
}

export default function AssistantPage() {
  const [text, setText] = React.useState("");
  const { messages, sendMessage, isLoading, reload } = useChat({ api: "/api/chat" });

  return (
    <PageShell size="md">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          title="Assistant"
          actions={
            messages.length > 0 ? (
              <Button variant="outline" size="sm" onClick={() => reload()}>Retry</Button>
            ) : null
          }
        />

        <div className="space-y-2">
          {messages.map((m) => (
            <Msg key={m.id} role={m.role} content={(m.content as any) ?? ""} />
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
            await sendMessage({ text: q });
            setText("");
          }}
          className="mt-6 flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText((e.target as HTMLInputElement).value)}
            placeholder="Message"
            className="flex-1 rounded border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={!text.trim() || isLoading}>Send</Button>
        </form>
      </div>
    </PageShell>
  );
}
