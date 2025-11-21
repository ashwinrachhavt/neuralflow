"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronRight, Flame, Sparkles, TimerReset } from "lucide-react";

import { CardDescriptionPreview } from "./CardDescriptionPreview";
import { CardExpanded } from "./CardExpanded";

export type CardPreviewTask = {
  id: string;
  title: string;
  descriptionMarkdown?: string | null;
  tags?: string[] | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  dueDate?: string | Date | null;
  estimatedPomodoros?: number | null;
  aiStatus?: "draft" | "enriched" | "blocked" | string | null;
};

export type CardProps = {
  task: CardPreviewTask;
  className?: string;
};

export function Card({ task, className }: CardProps) {
  const [open, setOpen] = useState(false);
  const priorityLabel = task.priority === "HIGH" ? "P1" : task.priority === "LOW" ? "P3" : task.priority ? "P2" : null;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const estimated = task.estimatedPomodoros ? task.estimatedPomodoros * 25 : null;

  return (
    <>
      <div
        className={cn(
          "group rounded-2xl border border-slate-200/80 bg-white/90 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg",
          "flex flex-col gap-3",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Task</p>
            <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
          </div>
          <ChevronRight className="size-4 text-slate-400 transition group-hover:translate-x-1" />
        </div>

        <CardDescriptionPreview content={task.descriptionMarkdown} />

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {priorityLabel ? (
            <Badge variant="secondary" className="bg-amber-50 text-amber-600">
              <Flame className="mr-1 size-3" />
              {priorityLabel}
            </Badge>
          ) : null}

          {estimated ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <TimerReset className="size-3" />
              {estimated} mins
            </span>
          ) : null}

          {due ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <CalendarDays className="size-3" />
              {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          ) : null}

          {task.aiStatus ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-0.5 text-white">
              <Sparkles className="size-3 text-amber-300" />
              {task.aiStatus}
            </span>
          ) : null}
        </div>

        {task.tags && task.tags.length ? (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {task.tags.map((tag) => (
              <span key={`${task.id}-${tag}`} className="rounded-full bg-slate-100 px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {open ? <CardExpanded taskId={task.id} open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
