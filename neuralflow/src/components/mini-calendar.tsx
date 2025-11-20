"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function getMonthGrid(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDay = start.getDay();
  const daysInMonth = end.getDate();
  const cells: { label: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < startDay; i++) cells.push({ label: null, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const curr = new Date(date.getFullYear(), date.getMonth(), d);
    const today = new Date();
    const isToday = curr.toDateString() === today.toDateString();
    cells.push({ label: d, isToday });
  }
  while (cells.length % 7 !== 0) cells.push({ label: null, isToday: false });
  return cells;
}

export function MiniCalendar() {
  const [cursor, setCursor] = React.useState(() => new Date());
  const [selected, setSelected] = React.useState<Date | null>(null);
  const cells = getMonthGrid(cursor);
  const monthName = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const weekday = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  function prevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function onSelectDay(day: number) {
    const dt = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    setSelected(dt);
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <button aria-label="Previous month" onClick={prevMonth} className="rounded px-2 py-1 text-xs hover:bg-accent">
          ‹
        </button>
        <Link href="/calendar" className="flex-1 text-center">
          <CardTitle className="text-base hover:underline">
            {monthName}
          </CardTitle>
        </Link>
        <button aria-label="Next month" onClick={nextMonth} className="rounded px-2 py-1 text-xs hover:bg-accent">
          ›
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {weekday.map((d, idx) => (<div key={`${d}-${idx}`} className="py-1">{d}</div>))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.label) return <div key={i} className="py-1" />;
            const isSelected = selected && new Date(cursor.getFullYear(), cursor.getMonth(), c.label).toDateString() === selected.toDateString();
            const base = "rounded-md text-center py-1 text-xs cursor-pointer select-none";
            const todayCls = c.isToday ? " bg-foreground text-background" : "";
            const selCls = isSelected ? " ring-2 ring-primary" : "";
            return (
              <button
                type="button"
                key={i}
                onClick={() => onSelectDay(c.label as number)}
                className={`${base}${todayCls}${selCls}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
