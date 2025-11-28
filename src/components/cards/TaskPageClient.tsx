"use client";

import { useEffect, useState } from "react";
import { useCard } from "@/hooks/api";
import { CardTitleEditor } from "./CardTitleEditor";
import { CardMetadata } from "./CardMetadata";
import dynamic from "next/dynamic";
const SmartTipTapEditor = dynamic(
  () => import("@/components/editor/SmartTipTapEditor").then((m) => m.SmartTipTapEditor),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" /> },
);

export default function TaskPageClient({ taskId }: { taskId: string }) {
  const { data, isLoading } = useCard(taskId);
  const [noteId, setNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    if (data.note?.id) { setNoteId(data.note.id); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cards/${taskId}/note`, { method: 'POST' });
        if (!res.ok) return;
        const j = await res.json().catch(() => null);
        if (!cancelled && j?.noteId) setNoteId(j.noteId);
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [data?.note?.id, taskId]);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
        <div className="space-y-5">
          {isLoading || !data ? (
            <div className="space-y-3">
              <div className="h-4 w-56 animate-pulse rounded bg-muted" />
              <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" />
            </div>
          ) : (
            <>
              <CardMetadata task={data.task} />
              {(data.note?.id || noteId) ? (
                <SmartTipTapEditor initialContent={data.note?.contentJson} entity={{ type: 'note', noteId: (data.note?.id ?? noteId)! }} />
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">Preparing editor…</div>
              )}
              {/* AI quick actions removed */}
            </>
          )}
        </div>
      </section>

      {/* Context sidebar removed (Smart Cues & Related Notes) */}
    </div>
  );
}
