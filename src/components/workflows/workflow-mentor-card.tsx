"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWorkflowMemory, useDetectWorkflow, useSaveWorkflowTemplate, useWorkflowSimulation } from "@/hooks/workflows";
import { useBoard, useCreateCard, useDefaultBoardId, type BoardNormalized } from "@/hooks/api";
import type { WorkflowDetectionCandidate, WorkflowSimulationResult } from "@/types/workflows";

export function WorkflowMentorCard() {
  const { data, isLoading } = useWorkflowMemory();
  const detectMutation = useDetectWorkflow();
  const saveTemplate = useSaveWorkflowTemplate();
  const simulate = useWorkflowSimulation();
  const { data: defaultBoard } = useDefaultBoardId();
  const boardId = defaultBoard?.id ?? "";
  const { data: boardData } = useBoard(boardId);
  const createTask = useCreateCard();

  const [candidate, setCandidate] = useState<WorkflowDetectionCandidate | null>(null);
  const [candidateTitle, setCandidateTitle] = useState("");
  const [candidateSummary, setCandidateSummary] = useState("");
  const [simulationGoal, setSimulationGoal] = useState("Prep system design round for AppFolio.");
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [targetDate, setTargetDate] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [simulationResult, setSimulationResult] = useState<WorkflowSimulationResult | null>(null);

  const memoBoard = boardData as BoardNormalized | undefined;

  const defaultColumnId = useMemo(() => {
    if (!memoBoard) return null;
    const order = memoBoard.board?.columnOrder;
    const columns = memoBoard.board?.columns;
    if (!order || !columns) return null;
    const todo = order.find((columnId) => /todo/i.test(columns[columnId]?.name ?? ""));
    return todo ?? order[0] ?? null;
  }, [boardData]);

  const templates = data?.templates ?? [];
  const analytics = data?.analytics ?? null;

  const handleDetect = () => {
    detectMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (!res.detected || !res.candidate) {
          toast.info(res.reason ?? "No reusable workflow yet.");
          setCandidate(null);
          return;
        }
        setCandidate(res.candidate);
        setCandidateTitle(res.candidate.title);
        setCandidateSummary(res.candidate.summary ?? "");
      },
      onError: (err) => toast.error(err.message || "Failed to run detector"),
    });
  };

  const handleSaveTemplate = () => {
    if (!candidate) return;
    saveTemplate.mutate(
      {
        title: candidateTitle || candidate.title,
        summary: candidateSummary || candidate.summary,
        contextTags: candidate.contextTags,
        triggerExamples: candidate.triggerExamples,
        confidence: candidate.confidence,
        rationale: candidate.rationale,
        stages: candidate.stages,
      },
      {
        onSuccess: () => {
          toast.success("Workflow saved");
          setCandidate(null);
        },
        onError: (err) => toast.error(err.message || "Could not save workflow"),
      },
    );
  };

  const handleSimulate = () => {
    if (!simulationGoal.trim()) {
      toast.error("Enter a goal to simulate.");
      return;
    }
    simulate.mutate(
      {
        templateId: selectedTemplateId,
        goal: simulationGoal,
        hoursPerDay,
        targetDate: targetDate || undefined,
      },
      {
        onSuccess: (result) => {
          toast.success("Simulation complete");
          setSimulationResult(result);
        },
        onError: (err) => toast.error(err.message || "Failed to simulate"),
      },
    );
  };

  const handleAddTask = (title: string, description: string) => {
    if (!boardId || !defaultColumnId) {
      toast.error("Create a board (or columns) before pushing tasks.");
      return;
    }

    createTask.mutate(
      { boardId, columnId: defaultColumnId, title, descriptionMarkdown: description },
      {
        onSuccess: () => toast.success(`Added “${title}”`),
        onError: () => toast.error("Failed to create task"),
      },
    );
  };

  const templateCallouts = useMemo(() => {
    const map = new Map<string, { headline: string; imbalance: string; action: string }>();
    analytics?.perTemplate.forEach((entry) => map.set(entry.templateId, entry));
    return map;
  }, [analytics]);

  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-amber-400" />
          Workflow Mentor
        </CardTitle>
        <p className="text-xs text-muted-foreground">Learns your process, simulates timelines, and nudges rebalances.</p>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Workflow memory</h3>
            <Button variant="outline" size="sm" onClick={handleDetect} disabled={detectMutation.isPending} className="gap-2">
              {detectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              Detect
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No templates yet. Detect one from your recent tasks.</p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{template.title}</div>
                      <p className="text-xs text-muted-foreground">{template.summary || "—"}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{template.stages.length} steps</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.stages.map((stage) => (
                      <Badge key={stage.id ?? stage.title} variant="outline">
                        {stage.title}
                      </Badge>
                    ))}
                  </div>
                  {templateCallouts.has(template.id) ? (
                    <div className="mt-2 rounded-md bg-muted/40 p-2 text-[11px]">
                      <p className="font-medium">{templateCallouts.get(template.id)?.headline}</p>
                      <p className="text-muted-foreground">{templateCallouts.get(template.id)?.imbalance}</p>
                      <p className="text-foreground">{templateCallouts.get(template.id)?.action}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          {candidate ? (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50/80 p-3 dark:border-amber-300/40 dark:bg-amber-900/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Proposed template</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={saveTemplate.isPending}
                  className="gap-1 text-[12px]"
                >
                  {saveTemplate.isPending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                  Save
                </Button>
              </div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Name</label>
              <Input value={candidateTitle} onChange={(e) => setCandidateTitle(e.target.value)} className="mt-1 mb-2" />
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Summary</label>
              <Textarea
                value={candidateSummary}
                onChange={(e) => setCandidateSummary(e.target.value)}
                className="mt-1 mb-2"
              />
              <div className="space-y-2">
                {candidate.stages.map((stage, idx) => (
                  <div key={`${stage.title}-${idx}`} className="rounded-md border border-amber-200/80 p-2">
                    <div className="text-xs font-medium">{stage.title}</div>
                    <p className="text-[11px] text-muted-foreground">{stage.summary}</p>
                    <div className="mt-1 text-[10px] uppercase text-muted-foreground">
                      {stage.expectedDurationMinutes ? `${stage.expectedDurationMinutes} min` : "adaptive"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {analytics?.summary ? (
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
              <p className="font-semibold">Process-level insight</p>
              <p className="text-muted-foreground">{analytics.summary}</p>
              {analytics.globalAdvice.length ? (
                <ul className="mt-1 list-disc pl-4 text-[11px] text-muted-foreground">
                  {analytics.globalAdvice.map((item, idx) => (
                    <li key={`${item}-${idx}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Simulate next milestone</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase text-muted-foreground">Template</label>
            <select
              value={selectedTemplateId ?? ""}
              onChange={(e) => setSelectedTemplateId(e.target.value || undefined)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Auto (ad-hoc)</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <label className="text-[11px] uppercase text-muted-foreground">Goal</label>
            <Textarea value={simulationGoal} onChange={(e) => setSimulationGoal(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] uppercase text-muted-foreground">Due date</label>
                <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] uppercase text-muted-foreground">Hours / day</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={hoursPerDay}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setHoursPerDay(!Number.isNaN(next) && next > 0 ? next : 1);
                  }}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleSimulate} disabled={simulate.isPending} className="gap-2">
            {simulate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Simulate
          </Button>
          {simulationResult ? (
            <div className="space-y-3 rounded-lg border border-border/60 p-3">
              <div>
                <p className="text-sm font-semibold">Summary</p>
                <p className="text-xs text-muted-foreground">{simulationResult.summary}</p>
              </div>
              {simulationResult.rebalances.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rebalances</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {simulationResult.rebalances.map((entry, idx) => (
                      <li key={`${entry.headline}-${idx}`} className="rounded-md bg-muted/30 p-2">
                        <strong>{entry.headline}: </strong>
                        {entry.action}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {simulationResult.bottlenecks.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bottlenecks</p>
                  <ul className="list-disc pl-5 text-xs text-red-500">
                    {simulationResult.bottlenecks.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule</p>
                <div className="mt-1 space-y-2 text-[11px]">
                  {simulationResult.schedule.map((day) => (
                    <div key={day.dateLabel} className="rounded-md border border-border/40 p-2">
                      <div className="font-medium">{day.dateLabel}</div>
                      {day.blocks.length === 0 ? (
                        <p className="text-muted-foreground">Free / buffer</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {day.blocks.map((block, idx) => (
                            <li key={`${block.stageTitle}-${idx}`} className="flex justify-between">
                              <span>{block.stageTitle}</span>
                              <span className="text-muted-foreground">{block.minutes}m</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {simulationResult.suggestedTasks.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Auto tasks & quizzes
                  </p>
                  {simulationResult.suggestedTasks.map((task, idx) => (
                    <div key={`${task.title}-${idx}`} className="rounded-md border border-border/50 p-2">
                      <div className="text-sm font-medium">{task.title}</div>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <Badge key={`${task.title}-${tag}`} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleAddTask(task.title, task.description)}
                        >
                          Add to Todo
                        </Button>
                      </div>
                    </div>
                  ))}
                  {simulationResult.quizPrompts.length ? (
                    <div className="rounded-md border border-border/50 p-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Quiz prompts
                      </p>
                      <ul className="mt-1 space-y-1 text-xs">
                        {simulationResult.quizPrompts.map((prompt, idx) => (
                          <li key={`${prompt}-${idx}`} className="rounded bg-muted/30 p-2">
                            {prompt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
