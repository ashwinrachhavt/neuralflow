"use client";

import * as React from "react";
import { Sparkles, Loader2, Check, Gem } from "lucide-react";
import { toast } from "sonner";

import type { GemAward, TaskDTO } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type OrchestrateResponse = {
  tasks: TaskDTO[];
  gemAwards: GemAward[];
  meta: Record<string, unknown>;
};

function TaskItem({ task }: { task: TaskDTO }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{task.title}</p>
        <span className="rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
          {task.priority ?? "MEDIUM"}
        </span>
      </div>
      {task.descriptionMarkdown ? (
        <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{task.descriptionMarkdown}</p>
      ) : null}
      {task.tags && task.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[0.65rem]">
              {t}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AwardItem({ award }: { award: GemAward }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
      <div className="mt-0.5">
        <Gem className="size-4 text-purple-500" />
      </div>
      <div>
        <p className="text-sm font-medium">{award.title}</p>
        <p className="text-xs text-muted-foreground">{award.oneLineLore}</p>
      </div>
    </div>
  );
}

export function DaoPlanner() {
  const [text, setText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [tasks, setTasks] = React.useState<TaskDTO[] | null>(null);
  const [awards, setAwards] = React.useState<GemAward[] | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsLoading(true);
    setTasks(null);
    setAwards(null);
    try {
      const res = await fetch("/api/dao/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainDumpText: text.trim() }),
      });
      if (res.status === 401) {
        throw new Error("Please sign in to use Dao");
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed (${res.status})`);
      }
      const data = (await res.json()) as OrchestrateResponse;
      setTasks(data.tasks || []);
      setAwards(data.gemAwards || []);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  const accept = async () => {
    if (!tasks || tasks.length === 0) return;
    try {
      const res = await fetch("/api/dao/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });
      if (res.status === 401) {
        throw new Error("Please sign in to add tasks");
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed (${res.status})`);
      }
      const { created } = await res.json();
      toast.success(`Added ${created} task${created === 1 ? "" : "s"} to your board`);
      setText("");
      setTasks(null);
      setAwards(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add tasks");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" /> Plan with Dao
          </CardTitle>
          <CardDescription>Describe your day and let Dao draft tasks + rewards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Prep Paces design, 3 follow-ups, 2 DSA sessions, cleanup..."
              className="min-h-32"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!text.trim() || isLoading} className="gap-2">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isLoading ? "Thinking…" : "Generate"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setText(""); setTasks(null); setAwards(null); }}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested Tasks</CardTitle>
            <CardDescription>Review and accept to add to your Kanban board.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isLoading && (!tasks || tasks.length === 0) && (
                <div className="space-y-2">
                  <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                  <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
                </div>
              )}
              {tasks?.map((t, i) => <TaskItem key={`${t.title}-${i}`} task={t} />)}
              {!isLoading && (tasks?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet. Describe what you want to do today.</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={accept} disabled={!tasks || tasks.length === 0} className="gap-2">
                <Check className="size-4" /> Add to Board
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awards</CardTitle>
            <CardDescription>Meaningful progress earns stones. Keep the flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {awards?.map((a, i) => <AwardItem key={`${a.slug}-${i}`} award={a} />)}
              {(!awards || awards.length === 0) && (
                <p className="text-sm text-muted-foreground">No awards yet. Complete deep work or ship something.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
