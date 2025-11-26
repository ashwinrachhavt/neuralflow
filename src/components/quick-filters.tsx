"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/chip";
import { TASK_TOPICS } from "@/lib/ai/taxonomy";

export type FilterState = {
  type?: 'deep' | 'shallow' | 'all';
  priority?: 'P1' | 'P2' | 'P3' | 'all';
  topic?: 'all' | (typeof TASK_TOPICS[number]);
};

export function QuickFilters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const type = value.type ?? 'all';
  const priority = value.priority ?? 'all';
  const topic = value.topic ?? 'all';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onChange({ ...value, topic: 'all' })}><Chip active={topic==='all'} variant="muted">All Topics</Chip></button>
          {TASK_TOPICS.slice(0, 8).map((t) => (
            <button key={t} onClick={() => onChange({ ...value, topic: t })}><Chip active={topic===t} variant="work">{t}</Chip></button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onChange({ ...value, type: 'all' })}><Chip active={type==='all'} variant="muted">All</Chip></button>
          <button onClick={() => onChange({ ...value, type: 'deep' })}><Chip active={type==='deep'} variant="work">Deep Work</Chip></button>
          <button onClick={() => onChange({ ...value, type: 'shallow' })}><Chip active={type==='shallow'} variant="work">Shallow Work</Chip></button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onChange({ ...value, priority: 'all' })}><Chip active={priority==='all'} variant="muted">All Priorities</Chip></button>
          <button onClick={() => onChange({ ...value, priority: 'P1' })}><Chip active={priority==='P1'} variant="priority">P1</Chip></button>
          <button onClick={() => onChange({ ...value, priority: 'P2' })}><Chip active={priority==='P2'} variant="priority">P2</Chip></button>
          <button onClick={() => onChange({ ...value, priority: 'P3' })}><Chip active={priority==='P3'} variant="priority">P3</Chip></button>
        </div>
      </CardContent>
    </Card>
  );
}
