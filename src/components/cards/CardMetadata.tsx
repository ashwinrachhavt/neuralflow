import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarDays, Flame, LayoutGrid, MapPin, Tag, TimerReset } from "lucide-react";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type CardMetadataProps = {
  task: {
    id: string;
    priority?: TaskPriority | null;
    tags?: string[] | null;
    estimatedPomodoros?: number | null;
    dueDate?: string | Date | null;
    column?: { id: string; title: string } | null;
    project?: { id: string; title: string } | null;
    location?: string | null;
  };
  onPriorityChange?: (priority: TaskPriority) => void;
  className?: string;
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

export function CardMetadata({ task, onPriorityChange, className }: CardMetadataProps) {
  const currentPriority = task.priority ?? "MEDIUM";
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const estimateMinutes = task.estimatedPomodoros ? task.estimatedPomodoros * 25 : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={currentPriority}
          onValueChange={(value) => onPriorityChange?.(value as TaskPriority)}
        >
          <SelectTrigger size="sm" className="min-w-[120px]">
            <SelectValue>
              <span className="flex items-center gap-2">
                <Flame className="size-4 text-amber-500" />
                Priority: {PRIORITY_LABELS[currentPriority]}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
              <SelectItem key={priority} value={priority}>
                <div className="flex items-center gap-2">
                  <Flame className={cn("size-4", priorityColor(priority))} />
                  {PRIORITY_LABELS[priority]}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {task.column ? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <LayoutGrid className="size-4" />
            {task.column.title}
          </Button>
        ) : null}

        {task.location ? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            <span className="max-w-[180px] truncate">{task.location}</span>
          </Button>
        ) : null}

        {task.project ? (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Tag className="size-4" />
            {task.project.title}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {due ? (
          <div className="flex items-center gap-1.5 rounded-full border px-3 py-1">
            <CalendarDays className="size-3.5" />
            Due {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
        ) : (
          <button className="text-xs text-foreground underline-offset-4 hover:underline">
            + Add due date
          </button>
        )}

        {estimateMinutes ? (
          <div className="flex items-center gap-1.5 rounded-full border px-3 py-1">
            <TimerReset className="size-3.5" />
            {estimateMinutes} mins focus
          </div>
        ) : null}
      </div>

        {task.tags && task.tags.length ? (
        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs uppercase tracking-wide">
              {tag}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No labels yet – add a tag to help AI sort this later.</p>
      )}
    </div>
  );
}

function priorityColor(priority: TaskPriority) {
  switch (priority) {
    case "HIGH":
      return "text-amber-500";
    case "LOW":
      return "text-emerald-500";
    default:
      return "text-muted-foreground";
  }
}
