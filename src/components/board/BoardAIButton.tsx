"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { PlannerDock } from "@/components/ai/PlannerDock";

export function BoardAIButton({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        className="rounded-full border-border/40 bg-foreground/10 text-foreground hover:border-border/60"
        onClick={() => setOpen(true)}
      >
        <Wand2 className="size-4" /> Generate with AI
      </Button>
      <PlannerDock open={open} onClose={() => setOpen(false)} boardId={boardId} />
    </>
  );
}
