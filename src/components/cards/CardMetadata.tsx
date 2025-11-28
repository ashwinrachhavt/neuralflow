import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarDays, Flame, LayoutGrid, MapPin, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useMyBoardsSlim } from "@/hooks/api";
import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRelative as formatRelativeDue } from "@/components/ui/due-date-control";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type CardMetadataProps = {
  task: {
    id: string;
    priority?: TaskPriority | null;
    tags?: string[] | null;
    estimatedPomodoros?: number | null;
    dueDate?: string | Date | null;
    column?: { id: string; title: string } | null;
    project?: { id: string; title: string } | null;
    location?: string | null;
    topics?: string[] | null;
    primaryTopic?: string | null;
  };
  onPriorityChange?: (priority: TaskPriority) => void;
  className?: string;
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

export function CardMetadata({ task, onPriorityChange, className }: CardMetadataProps) {
  const currentPriority = task.priority ?? "MEDIUM";
  const due = task.dueDate ? new Date(task.dueDate) : null;
  // Hide estimated focus minutes chip per request
  const { data: boards, isLoading } = useMyBoardsSlim();
  const qc = useQueryClient();

  const containingBoard = boards?.boards?.find(b => b.tasks.some(t => t.id === task.id));
  const columns = containingBoard?.columns?.slice().sort((a, b) => a.position - b.position) ?? [];
  const currentColumnId = task.column?.id ?? '';

  async function moveTo(columnId: string) {
    try {
      if (!columnId) return;
      const res = await fetch(`/api/tasks/${task.id}/column`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['card', task.id] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos','TODO'] as any }),
      ]);
    } catch (e: any) {
      // silent fail
      console.error(e);
    }
  }

  async function updatePriority(priority: TaskPriority) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) throw new Error('Failed to update priority');
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['card', task.id] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos','TODO'] as any }),
      ]);
    } catch (e: any) {
      console.error(e);
    }
  }

  // Tag editor removed per request

  // Due date dialog state
  const [dueOpen, setDueOpen] = React.useState(false);
  const init = React.useMemo(() => (task.dueDate ? new Date(task.dueDate) : new Date()), [task.dueDate]);
  const [cursor, setCursor] = React.useState<Date>(() => new Date(init.getFullYear(), init.getMonth(), 1));
  const [selected, setSelected] = React.useState<Date | null>(() => (task.dueDate ? new Date(task.dueDate as any) : null));
  const [hour, setHour] = React.useState<number>(() => (selected ? new Date(selected).getHours() : 9));
  const [minute, setMinute] = React.useState<number>(() => (selected ? new Date(selected).getMinutes() : 0));

  function cellsForMonth(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDay = start.getDay();
    const daysInMonth = end.getDate();
    const cells: { d: number | null; today: boolean }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ d: null, today: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const curr = new Date(date.getFullYear(), date.getMonth(), d);
      const today = new Date();
      const isToday = curr.toDateString() === today.toDateString();
      cells.push({ d, today: isToday });
    }
    while (cells.length % 7 !== 0) cells.push({ d: null, today: false });
    return cells;
  }

  async function saveDue() {
    try {
      let dueBody: string | null = null;
      if (selected) {
        const dt = new Date(selected);
        dt.setHours(hour, minute, 0, 0);
        dueBody = dt.toISOString();
      }
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: dueBody }),
      });
      if (!res.ok) throw new Error('Failed');
      setDueOpen(false);
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['card', task.id] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos','TODO'] as any }),
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  async function clearDue() {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: null }),
      });
      if (!res.ok) throw new Error('Failed');
      setDueOpen(false);
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['card', task.id] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos','TODO'] as any }),
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  function formatDue(d: Date) {
    return formatRelativeDue(d);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={currentPriority}
          onValueChange={(value) => { onPriorityChange?.(value as TaskPriority); updatePriority(value as TaskPriority); }}
        >
          <SelectTrigger size="sm" className="min-w-[120px]">
            <SelectValue>
              <span className="flex items-center gap-2">
                <Flame className="size-4 text-amber-500" />
                Priority: {PRIORITY_LABELS[currentPriority]}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
              <SelectItem key={priority} value={priority}>
                <div className="flex items-center gap-2">
                  <Flame className={cn("size-4", priorityColor(priority))} />
                  {PRIORITY_LABELS[priority]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {columns.length ? (
          <Select value={currentColumnId || undefined as any} onValueChange={(v) => moveTo(v)}>
            <SelectTrigger size="sm" className="min-w-[160px]">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <LayoutGrid className="size-4" />
                  {task.column?.title ?? 'No Status'}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value={currentColumnId} disabled>Loading…</SelectItem>
              ) : (
                columns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        ) : task.column ? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" disabled>
            <LayoutGrid className="size-4" />
            {task.column.title}
          </Button>
        ) : null}

        {task.location ? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <span className="max-w-[180px] truncate">{task.location}</span>
          </Button>
        ) : null}

        {task.project ? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Tag className="size-4" />
            {task.project.title}
          </Button>
        ) : null}

        {task.primaryTopic || (task.topics && task.topics.length) ? (
          <div className="ml-1 flex items-center gap-1">
            {task.primaryTopic ? (
              <span className="rounded px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px]">{task.primaryTopic}</span>
            ) : null}
            {(task.topics ?? []).filter(t => t !== task.primaryTopic).slice(0, 2).map((t) => (
              <span key={t} className="rounded px-2 py-0.5 bg-muted text-foreground/80 text-[10px]">{t}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border px-3 py-1 hover:bg-accent"
          onClick={() => setDueOpen(true)}
        >
          <CalendarDays className="size-3.5" />
          {task.dueDate ? formatDue(new Date(task.dueDate)) : (<span className="text-muted-foreground">Add due</span>)}
        </button>

        {null}
      </div>

      {null}
      <Dialog open={dueOpen} onOpenChange={setDueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set due date</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <button className="rounded px-2 py-1 hover:bg-accent" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></button>
              <div className="font-medium">{cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
              <button className="rounded px-2 py-1 hover:bg-accent" onClick={() => setCursor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight className="size-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (<div key={d} className="py-1">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cellsForMonth(cursor).map((c, idx) => {
                if (!c.d) return <div key={idx} className="py-1" />;
                const d = new Date(cursor.getFullYear(), cursor.getMonth(), c.d);
                const isSel = selected && d.toDateString() === new Date(selected).toDateString();
                const base = "rounded-md text-center py-1 text-sm cursor-pointer select-none";
                const todayCls = c.today ? " bg-foreground text-background" : " hover:bg-accent";
                const selCls = isSel ? " ring-2 ring-primary" : "";
                return (
                  <button key={idx} type="button" className={`${base}${todayCls}${selCls}`} onClick={() => setSelected(d)}>
                    {c.d}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(hour)} onValueChange={(v) => setHour(parseInt(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <SelectItem key={h} value={String(h)}>{new Date(2000,0,1,h).toLocaleTimeString(undefined,{hour:'numeric'})}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(minute)} onValueChange={(v) => setMinute(parseInt(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0,15,30,45].map((m) => (
                    <SelectItem key={m} value={String(m)}>{m.toString().padStart(2,'0')} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto text-xs text-muted-foreground">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearDue}>Clear</Button>
            <Button onClick={saveDue} disabled={!selected}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function priorityColor(priority: TaskPriority) {
  switch (priority) {
    case "HIGH":
      return "text-amber-500";
    case "LOW":
      return "text-emerald-500";
    default:
      return "text-muted-foreground";
  }
}
