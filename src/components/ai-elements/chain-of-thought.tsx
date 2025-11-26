"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2, Search, ImageIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ThoughtStep = { id: string; label: string; description?: string; status?: 'complete'|'active'|'pending' };

export function ChainOfThought({ defaultOpen = false, steps = [] as ThoughtStep[] }: { defaultOpen?: boolean; steps?: ThoughtStep[] }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border/60 bg-card/70">
      <div className="flex items-center justify-between px-3 py-2">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between gap-3">
            <CollapsibleTrigger className="text-sm font-medium">Chain of Thought</CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="px-2 pb-3">
              <div className="space-y-2">
                {steps.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1">No reasoning steps yet. Ask the assistant to plan or explain its thinking.</p>
                ) : steps.map((s) => (
                  <div key={s.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-background/60">
                    {s.status === 'complete' ? (
                      <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                    ) : s.status === 'active' ? (
                      <Loader2 className="mt-0.5 size-4 animate-spin text-indigo-500" />
                    ) : (
                      <Circle className="mt-0.5 size-4 text-muted-foreground" />
                    )}
                    <div className="text-xs">
                      <div className="font-medium">{s.label}</div>
                      {s.description ? <div className="text-muted-foreground">{s.description}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Search className="size-3.5" />
                  Search results
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">www.example.com</Badge>
                  <Badge variant="secondary" className="text-[10px]">www.docs.example</Badge>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <ImageIcon className="size-3.5" />
                  Image
                </div>
                <div className="mt-1 overflow-hidden rounded-md border">
                  <div className="h-32 w-full grid place-items-center text-xs text-muted-foreground bg-muted/40">Example image</div>
                  <div className="border-t px-2 py-1 text-[10px] text-muted-foreground">Example generated image caption</div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

export function ChainOfThoughtHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between px-3 py-2", className)}>{children}</div>;
}

export function ChainOfThoughtStep(props: { icon?: React.ReactNode; label?: string; description?: string; status?: 'complete'|'active'|'pending' }) {
  return (
    <div className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-background/60">
      {props.icon ?? <Circle className="mt-0.5 size-4 text-muted-foreground" />}
      <div className="text-xs">
        <div className="font-medium">{props.label}</div>
        {props.description ? <div className="text-muted-foreground">{props.description}</div> : null}
      </div>
    </div>
  );
}

