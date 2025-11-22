"use client";

import { useState } from "react";
import { useDaoOrchestrator } from "@/hooks/useDaoOrchestrator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function DaoPlayground() {
  const [dump, setDump] = useState("");
  const orchestrator = useDaoOrchestrator();

  const handleRun = () => {
    orchestrator.mutate({ brainDumpText: dump });
  };

  const ctx = orchestrator.data?.context as any;

  return (
    <div className="space-y-4">
      <Card className="border border-dashed border-primary/40">
        <CardHeader className="space-y-2">
          <h2 className="font-semibold text-lg">Dao Orchestrator Playground</h2>
          <p className="text-sm text-muted-foreground">
            Paste a brain dump to see generated tasks and gem awards.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder="Today I need to prep for interview, clean my room, and do 2 leetcode questions..."
            className="min-h-[140px]"
          />
          <Button onClick={handleRun} disabled={orchestrator.isPending}>
            {orchestrator.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Run Orchestrator
          </Button>

          {orchestrator.error && (
            <p className="text-sm text-red-500">{orchestrator.error.message}</p>
          )}
        </CardContent>
      </Card>

      {ctx && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h3 className="font-medium">Generated / Enriched Tasks</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {(ctx.enrichedTasks ?? ctx.generatedTasks ?? []).map(
                (t: any, idx: number) => (
                  <div
                    key={t.id ?? idx}
                    className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.title}</span>
                      {t.priority && (
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t.priority}
                        </span>
                      )}
                    </div>
                    {t.descriptionMarkdown && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {t.descriptionMarkdown}
                      </p>
                    )}
                    {t.tags && t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {t.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-medium">Gem Awards</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {(ctx.gemAwards ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No gems awarded for this run yet.
                </p>
              )}
              {(ctx.gemAwards ?? []).map((g: any) => (
                <div
                  key={g.slug}
                  className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3"
                >
                  <img
                    src={g.imageUrl}
                    alt={g.title}
                    className="h-10 w-10 rounded-full object-contain"
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{g.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.oneLineLore}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
