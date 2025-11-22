"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description?: string) => void | Promise<void>;
};

export function NewCardModal({ open, onClose, onSubmit }: Props) {
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open) { setTitle(""); setDesc(""); setPending(false); }
  }, [open]);

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    const t = title.trim();
    if (!t || pending) return;
    try {
      setPending(true);
      await onSubmit(t, desc.trim() || undefined);
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="w-full max-w-md rounded-2xl border border-border/60 bg-card/95 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight">New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Title</label>
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Description (optional)</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add quick context" rows={4} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!title.trim() || pending}>Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

