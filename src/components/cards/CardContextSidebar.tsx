import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Brain, Link as LinkIcon, ListChecks, StickyNote, Sparkles } from "lucide-react";

export type RelatedItem = {
  id: string;
  title: string;
  type: "note" | "task" | "quiz" | "link" | "insight";
  meta?: string;
};

export type CardContextSidebarProps = {
  taskId: string;
  relatedItems?: RelatedItem[];
  className?: string;
};

export function CardContextSidebar({ taskId, relatedItems, className }: CardContextSidebarProps) {
  const items =
    relatedItems ??
    [
      { id: `${taskId}-note`, title: "Research notes", type: "note", meta: "Updated 2h ago" },
      { id: `${taskId}-tasks`, title: "Prep system design prompts", type: "task", meta: "3 subtasks" },
      { id: `${taskId}-quiz`, title: "Flashcards: Kanban", type: "quiz", meta: "12 cards" },
      { id: `${taskId}-link`, title: "Product brief", type: "link", meta: "docs.notions.so" },
    ];

  return (
    <aside className={cn("hidden lg:flex w-[260px] flex-col border-l bg-slate-50/70", className)}>
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-6 p-4">
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Context</p>
            <div className="mt-3 rounded-lg border bg-white/70 p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Sparkles className="size-3.5" />
                Smart cues
              </div>
              <p className="mt-2 text-slate-700">
                This space will surface embeddings, related notes, and system suggestions as we wire up the AI agents.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Related</h4>
              <Badge variant="secondary" className="text-[10px]">
                {items.length} items
              </Badge>
            </div>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg border bg-white/80 p-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {getIcon(item.type)}
                    {item.type}
                  </div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  {item.meta ? <p className="text-xs text-muted-foreground">{item.meta}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}

function getIcon(type: RelatedItem["type"]) {
  const classes = "size-3 text-slate-400";
  switch (type) {
    case "note":
      return <StickyNote className={classes} />;
    case "task":
      return <ListChecks className={classes} />;
    case "quiz":
      return <Brain className={classes} />;
    case "insight":
      return <Sparkles className={classes} />;
    default:
      return <LinkIcon className={classes} />;
  }
}
