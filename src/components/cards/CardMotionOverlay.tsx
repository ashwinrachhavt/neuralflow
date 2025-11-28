"use client";

import { Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCard } from "@/hooks/api";
import { X } from "lucide-react";

import { CardTitleEditor } from "./CardTitleEditor";
import dynamic from "next/dynamic";

const SmartTipTapEditor = dynamic(
  () => import("@/components/editor/SmartTipTapEditor").then((m) => m.SmartTipTapEditor),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" /> },
);

export type CardMotionOverlayProps = {
  taskId: string;
  open: boolean;
  onClose: () => void;
};

export function CardMotionOverlay({ taskId, open, onClose }: CardMotionOverlayProps) {
  const { data, isLoading } = useCard(taskId);
  const [noteId, setNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (data?.note?.id) {
      setNoteId(data.note.id);
      return;
    }
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
  }, [open, data?.note?.id, taskId]);

  return (
    <AnimatePresence>
      {open ? (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Expanding container with shared layoutId */}
          <motion.div
            key={`overlay-${taskId}`}
            layoutId={`card-${taskId}`}
            className="fixed inset-4 z-50 overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xl"
            initial={{ opacity: 0.92 }}
            animate={{ opacity: 1, borderRadius: 16 }}
            exit={{ opacity: 0.92, borderRadius: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <section className="flex h-full w-full">
              <div className="flex flex-1 flex-col bg-background/70">
                <div className="flex items-center justify-between border-b border-border/60 bg-background/70 px-6 py-4">
                  <div>
                    {data ? (
                      <motion.div layoutId={`card-title-${taskId}`}>
                        <CardTitleEditor taskId={taskId} initialTitle={data.task.title} />
                      </motion.div>
                    ) : (
                      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                    )}
                  </div>
                  <button className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:bg-foreground/10" onClick={onClose} aria-label="Close">
                    <X className="size-4" />
                  </button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="h-full px-6 py-5">
                    {isLoading || !data ? (
                      <div className="space-y-4">
                        <div className="h-4 w-[60%] animate-pulse rounded bg-muted" />
                        <div className="h-[60vh] animate-pulse rounded-xl bg-muted/50" />
                      </div>
                    ) : (data.note?.id || noteId) ? (
                      <SmartTipTapEditor
                        initialContent={data.note?.contentJson}
                        entity={{ type: 'note', noteId: (data.note?.id ?? noteId)! }}
                        frame="bare"
                        expanded
                        className="h-full"
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">Preparing editor…</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              {/* Context sidebar removed (Smart Cues & Related Notes) */}
            </section>
          </motion.div>
        </Fragment>
      ) : null}
    </AnimatePresence>
  );
}
