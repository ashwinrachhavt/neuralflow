"use client";

import { useCard } from "@/hooks/api";
import { CardTitleEditor } from "./CardTitleEditor";
import { CardMetadata } from "./CardMetadata";
import { CardTiptapEditor } from "./CardTiptapEditor";
import { CardAIDock } from "./CardAIDock";
import { CardContextSidebar } from "./CardContextSidebar";

export default function TaskPageClient({ taskId }: { taskId: string }) {
  const { data, isLoading } = useCard(taskId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
        <div className="border-b border-border/60 pb-4">
          {isLoading || !data ? (
            <div className="h-9 w-60 animate-pulse rounded bg-muted" />
          ) : (
            <CardTitleEditor taskId={taskId} initialTitle={data.task.title} />
          )}
        </div>

        <div className="mt-4 space-y-5">
          {isLoading || !data ? (
            <div className="space-y-3">
              <div className="h-4 w-56 animate-pulse rounded bg-muted" />
              <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" />
            </div>
          ) : (
            <>
              <CardMetadata task={data.task} />
              <CardTiptapEditor initialContent={data.note?.contentJson} noteId={data.note?.id} />
              <CardAIDock taskId={taskId} />
            </>
          )}
        </div>
      </section>

      <CardContextSidebar taskId={taskId} />
    </div>
  );
}
