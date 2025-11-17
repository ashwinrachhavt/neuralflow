"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function BrainDump() {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/dao/orchestrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brainDumpText: text }) });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      const count = (json.tasks || []).length;
      toast.success(`Planned ${count} task${count === 1 ? '' : 's'}`);
      setText("");
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to plan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Brain Dump</CardTitle>
        <CardDescription>Capture a thought and let Dao plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Capture a new thought…" className="min-h-24" />
        <div className="flex justify-end">
          <Button size="sm" onClick={submit} disabled={!text.trim() || busy}>{busy ? 'Adding…' : 'Add'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

