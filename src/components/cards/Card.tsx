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
          "group rounded-2xl border border-border/60 bg-card/80 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card/90 hover:shadow-lg",
          "flex flex-col gap-3",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Task</p>
            <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" />
        </div>

        <CardDescriptionPreview content={task.descriptionMarkdown} />

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {priorityLabel ? (
            <Badge variant="secondary">
              <Flame className={cn("mr-1 size-3", task.priority === 'HIGH' ? 'text-amber-500' : task.priority === 'LOW' ? 'text-emerald-500' : 'text-muted-foreground')} />
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
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2 py-0.5 text-background">
              <Sparkles className="size-3 text-amber-300" />
              {task.aiStatus}
            </span>
          ) : null}
        </div>

        {task.tags && task.tags.length ? (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {task.tags.map((tag) => (
              <span key={`${task.id}-${tag}`} className="rounded-full bg-muted px-2 py-0.5">
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
