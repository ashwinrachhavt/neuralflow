"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function formatRelative(date: Date) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((+target - +start) / 86400000);
  if (diffDays === 0) return `Today • ${date.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'})}`;
  if (diffDays === 1) return `Tomorrow • ${date.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'})}`;
  if (diffDays === -1) return `Yesterday • ${date.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'})}`;
  if (diffDays > 1) return `In ${diffDays} days • ${date.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'})}`;
  return `${Math.abs(diffDays)} days ago • ${date.toLocaleTimeString(undefined,{hour:'numeric', minute:'2-digit'})}`;
}

type Props = {
  taskId: string;
  dueDate?: string | Date | null;
  className?: string;
  stopPropagation?: boolean;
};

export function DueDateControl({ taskId, dueDate, className, stopPropagation }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const initial = React.useMemo(() => (dueDate ? new Date(dueDate as any) : null), [dueDate]);
  const [cursor, setCursor] = React.useState<Date>(() => new Date((initial ?? new Date()).getFullYear(), (initial ?? new Date()).getMonth(), 1));
  const [selected, setSelected] = React.useState<Date | null>(initial);
  const [hour, setHour] = React.useState<number>(() => (initial ? initial.getHours() : 9));
  const [minute, setMinute] = React.useState<number>(() => (initial ? initial.getMinutes() : 0));

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

  async function save(d: Date | null) {
    try {
      let dueBody: string | null = null;
      if (d) {
        const dt = new Date(d);
        dt.setHours(hour, minute, 0, 0);
        dueBody = dt.toISOString();
      }
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: dueBody }),
      });
      if (!res.ok) throw new Error('Failed');
      setOpen(false);
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['card', taskId] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos','TODO'] as any }),
        qc.invalidateQueries({ queryKey: ['me','boards'] as any }),
        qc.invalidateQueries({ queryKey: ['board'] as any }),
      ]);
    } catch (e) {
      console.error(e);
    }
  }

  const label = initial ? formatRelative(initial) : 'Add due';

  return (
    <>
      <button
        type="button"
        className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] hover:bg-accent", className)}
        onClick={(e) => { if (stopPropagation) e.stopPropagation(); setOpen(true); }}
      >
        <CalendarDays className="size-3.5" />
        {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
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
                  <button key={idx} type="button" className={cn(base, todayCls, selCls)} onClick={() => setSelected(d)}>
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
            <Button variant="outline" onClick={() => save(null)}>Clear</Button>
            <Button onClick={() => selected && save(selected)} disabled={!selected}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
