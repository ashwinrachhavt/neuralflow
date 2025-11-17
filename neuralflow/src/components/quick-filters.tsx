"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/chip";

export type FilterState = {
  type?: 'deep' | 'shallow' | 'all';
  priority?: 'P1' | 'P2' | 'P3' | 'all';
};

export function QuickFilters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const type = value.type ?? 'all';
  const priority = value.priority ?? 'all';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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

