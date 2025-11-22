import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Wand2 } from "lucide-react";

const DEFAULT_ACTIONS = [
  { id: "enrich", label: "Enrich" },
  { id: "suggest", label: "Suggest" },
  { id: "breakdown", label: "Breakdown" },
  { id: "summarize", label: "Summarize" },
  { id: "organize", label: "Auto-organize" },
];

export type CardAIDockProps = {
  taskId: string;
  onAction?: (actionId: string, taskId: string) => void;
  actions?: { id: string; label: string; icon?: ReactNode }[];
  className?: string;
};

export function CardAIDock({ taskId, onAction, actions = DEFAULT_ACTIONS, className }: CardAIDockProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t pt-4", className)}>
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="rounded-full border-dashed"
          onClick={() => onAction?.(action.id, taskId)}
        >
          {action.icon ?? <Wand2 className="size-4" />}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
