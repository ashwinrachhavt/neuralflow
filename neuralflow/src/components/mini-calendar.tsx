"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [now] = React.useState(new Date());
  const cells = getMonthGrid(now);
  const monthName = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const weekday = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{monthName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
          {weekday.map((d, idx) => (<div key={`${d}-${idx}`} className="py-1">{d}</div>))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((c, i) => (
            <div key={i} className={c.label ? (c.isToday ? 'rounded-md bg-foreground text-background text-center py-1 text-xs' : 'rounded-md text-center py-1 text-xs') : 'py-1'}>
              {c.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
