import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "@/lib/ai/client";
import type { WorkflowStage, WorkflowTemplate } from "@prisma/client";
import type {
  WorkflowAnalyticsSummary,
  WorkflowDetectionCandidate,
  WorkflowSimulationDay,
  WorkflowSimulationResult,
  WorkflowStageDTO,
} from "@/types/workflows";

type LeanTask = {
  id: string;
  title: string;
  descriptionMarkdown?: string | null;
  tags?: string[] | null;
  priority?: string | null;
  status?: string | null;
  estimatedPomodoros?: number | null;
  estimateMinutes?: number | null;
  columnName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type LeanGem = {
  stone: string;
  relatedTaskIds: string[];
  earnedAt: string;
};

function normalizeKeyword(token: string) {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function deriveStageKeywords(stage: Pick<WorkflowStage, "title" | "keywords">): string[] {
  const provided = stage.keywords ?? [];
  const auto = stage.title
    .split(/[-:]/)
    .flatMap((chunk) => chunk.split(/\s+/))
    .map(normalizeKeyword)
    .filter((kw) => kw.length > 2);
  const combined = new Set([...provided.map(normalizeKeyword), ...auto]);
  return Array.from(combined).filter(Boolean).slice(0, 8);
}

function matchesStage(stage: Pick<WorkflowStage, "title" | "keywords">, task: LeanTask) {
  const keywords = deriveStageKeywords(stage);
  const haystack = [
    task.title,
    task.descriptionMarkdown ?? "",
    ...(task.tags ?? []),
    task.columnName ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return keywords.some((kw) => kw && haystack.includes(kw));
}

export async function detectWorkflowCandidate(input: {
  tasks: LeanTask[];
  gems: LeanGem[];
}): Promise<{ detected: boolean; candidate?: WorkflowDetectionCandidate; reason?: string }> {
  if (!input.tasks.length) {
    return { detected: false, reason: "No recent tasks to analyze." };
  }

  const detectionSchema = z.object({
    detected: z.boolean(),
    reason: z.string(),
    workflow: z
      .object({
        name: z.string(),
        summary: z.string(),
        confidence: z.number().min(0).max(1),
        contextTags: z.array(z.string()).max(6),
        triggerExamples: z.array(z.string()).max(6),
        stages: z
          .array(
            z.object({
              title: z.string(),
              summary: z.string(),
              expectedDurationMinutes: z.number().int().min(20).max(720).nullable().optional(),
              artifacts: z.array(z.string()).max(4),
              keywords: z.array(z.string()).max(6),
              dependencies: z.array(z.string()).max(4),
            }),
          )
          .min(3)
          .max(8),
        matchedTaskIds: z.array(z.string()).min(3),
        rationale: z.string(),
      })
      .nullable(),
  });

  const trimmedTasks = input.tasks.slice(0, 60).map((task) => ({
    id: task.id,
    title: task.title,
    tags: task.tags ?? [],
    priority: task.priority ?? null,
    status: task.status ?? null,
    column: task.columnName ?? null,
    estimateMinutes: task.estimateMinutes ?? task.estimatedPomodoros ? (task.estimatedPomodoros ?? 0) * 25 : null,
    updatedAt: task.updatedAt,
  }));

  const gemDigest = input.gems.slice(0, 10).map((gem) => ({
    name: gem.stone,
    taskHits: gem.relatedTaskIds,
    earnedAt: gem.earnedAt,
  }));

  const prompt = [
    "You learn a user's recurring workflows based on their task history and gems (aka jewels).",
    "Goal: detect a reusable workflow template capturing repeated sequences of tasks.",
    "Rules:",
    "- Only return detected=true if the same intent shows up across >=3 tasks.",
    "- Stages should be concrete verbs (Research, Drill, Mock Interview, Reflection, etc.).",
    "- Include artifacts (outputs) and dependencies when obvious.",
    "- Provide short keywords for matching future tasks (lowercase).",
    "- If nothing meaningful appears, set detected=false with a short reason.",
    "",
    `Tasks sample (${trimmedTasks.length}):`,
    JSON.stringify(trimmedTasks, null, 2),
    "",
    `Recent gems (${gemDigest.length}):`,
    JSON.stringify(gemDigest, null, 2),
  ].join("\n");

  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: detectionSchema,
    prompt,
  });

  if (!object.detected || !object.workflow) {
    return { detected: false, reason: object.reason };
  }

  const candidate: WorkflowDetectionCandidate = {
    title: object.workflow.name,
    summary: object.workflow.summary,
    contextTags: object.workflow.contextTags,
    triggerExamples: object.workflow.triggerExamples,
    confidence: object.workflow.confidence,
    rationale: object.workflow.rationale,
    matchedTaskIds: object.workflow.matchedTaskIds,
    stages: object.workflow.stages.map((stage) => ({
      title: stage.title,
      summary: stage.summary,
      expectedDurationMinutes: stage.expectedDurationMinutes ?? null,
      artifacts: stage.artifacts,
      keywords: stage.keywords,
      dependencies: stage.dependencies,
    })),
  };
  return { detected: true, candidate };
}

type StageStat = {
  stageTitle: string;
  backlog: number;
  inFlight: number;
  done: number;
  avgEstimateMinutes: number;
  expectedDurationMinutes?: number | null;
  gemCount: number;
};

export async function buildWorkflowAnalyticsSummary({
  templates,
  tasks,
  gems,
}: {
  templates: (WorkflowTemplate & { stages: WorkflowStage[] })[];
  tasks: LeanTask[];
  gems: LeanGem[];
}): Promise<WorkflowAnalyticsSummary | null> {
  if (!templates.length) return null;

  const stageStatsByTemplate = templates.map((template) => {
    const stats: StageStat[] = template.stages.map((stage) => {
      const matches = tasks.filter((task) => matchesStage(stage, task));
      const minutes = matches.map((task) => task.estimateMinutes ?? (task.estimatedPomodoros ?? 0) * 25);
      const avg =
        minutes.length > 0 ? Math.round(minutes.reduce((sum, val) => sum + (val || 0), 0) / minutes.length) : 0;
      const stageTaskIds = new Set(matches.map((t) => t.id));
      const gemCount = gems.filter((gem) => gem.relatedTaskIds.some((id) => stageTaskIds.has(id))).length;
      return {
        stageTitle: stage.title,
        backlog: matches.filter((task) => task.status === "BACKLOG" || task.status === "TODO").length,
        inFlight: matches.filter((task) => task.status === "IN_PROGRESS").length,
        done: matches.filter((task) => task.status === "DONE").length,
        avgEstimateMinutes: avg,
        expectedDurationMinutes: stage.expectedDurationMinutes ?? null,
        gemCount,
      };
    });
    return { templateId: template.id, title: template.title, stats };
  });

  const analyticsSchema = z.object({
    summary: z.string(),
    perTemplate: z
      .array(
        z.object({
          templateId: z.string(),
          headline: z.string(),
          imbalance: z.string(),
          action: z.string(),
        }),
      )
      .max(6),
    globalAdvice: z.array(z.string()).max(3),
  });

  const prompt = [
    "You are an AI mentor looking at workflow templates and how the user actually spends time.",
    "For each template you get stage stats: backlog vs done counts, average minutes, and how many gems were earned for those stages.",
    "Call out where they over-invest (too many backlog or minutes) and under-invest (few completions).",
    "Return concise recommendations.",
    JSON.stringify(stageStatsByTemplate, null, 2),
  ].join("\n");

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: analyticsSchema,
    prompt,
  });

  return object;
}

type SimulationTemplate = {
  template?: WorkflowTemplate & { stages: WorkflowStage[] };
  fallbackStages?: WorkflowStageDTO[];
  goal: string;
  targetDate?: Date | null;
  hoursPerDay?: number | null;
};

function defaultStages(): WorkflowStageDTO[] {
  return [
    { title: "Research + Inputs", summary: "Collect company + problem context.", expectedDurationMinutes: 120, keywords: ["research"] },
    { title: "Deep Work / Drills", summary: "Design, drills, or build core artifact.", expectedDurationMinutes: 180, keywords: ["drill", "design"] },
    { title: "Mock + Feedback", summary: "Run dry runs, mocks, or share for critique.", expectedDurationMinutes: 120, keywords: ["mock", "feedback"] },
    { title: "Reflection + Packaging", summary: "Summarize learnings, prep outreach.", expectedDurationMinutes: 60, keywords: ["reflection", "summary"] },
  ];
}

function minutesForStage(stage: WorkflowStage | WorkflowStageDTO) {
  if (stage.expectedDurationMinutes && stage.expectedDurationMinutes > 0) return stage.expectedDurationMinutes;
  return 90;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export async function runWorkflowSimulation(input: SimulationTemplate): Promise<{
  schedule: WorkflowSimulationDay[];
  result: WorkflowSimulationResult;
  totalMinutes: number;
}> {
  const hoursPerDay = Math.max(1, Math.round(input.hoursPerDay ?? 3));
  const stageSource = input.template?.stages ?? input.fallbackStages ?? defaultStages();
  const stagesQueue = stageSource.map((stage, idx) => ({
    index: idx,
    title: stage.title,
    summary: stage.summary ?? "",
    remainingMinutes: minutesForStage(stage),
  }));

  const start = new Date();
  const target = input.targetDate ?? new Date(start.getTime() + 5 * 24 * 3600 * 1000);
  const msPerDay = 24 * 3600 * 1000;
  const totalDays = Math.max(1, Math.ceil((target.getTime() - start.getTime()) / msPerDay) + 1);
  const dailyCapacity = hoursPerDay * 60;

  const schedule: WorkflowSimulationDay[] = [];
  let stageIdx = 0;
  let dayIndex = 0;
  const queue = stagesQueue.map((stage) => ({ ...stage }));

  const ensureDay = (idx: number) => {
    if (!schedule[idx]) {
      const label =
        idx < totalDays ? formatDateLabel(new Date(start.getTime() + idx * msPerDay)) : `Overflow +${idx - totalDays + 1}`;
      schedule[idx] = { dateLabel: label, blocks: [] };
    }
  };

  while (queue[stageIdx]) {
    ensureDay(dayIndex);
    let capacityLeft = dailyCapacity - schedule[dayIndex].blocks.reduce((sum, block) => sum + block.minutes, 0);

    if (capacityLeft <= 0) {
      dayIndex += 1;
      continue;
    }

    const current = queue[stageIdx];
    const slice = Math.min(current.remainingMinutes, capacityLeft);
    schedule[dayIndex].blocks.push({
      stageTitle: current.title,
      minutes: slice,
      focus: current.summary.slice(0, 120) || "Advance this stage.",
    });
    current.remainingMinutes -= slice;

    if (current.remainingMinutes <= 0) {
      stageIdx += 1;
    }

    if (capacityLeft - slice <= 0) {
      dayIndex += 1;
    }

    if (dayIndex > totalDays + 6) {
      break;
    }
  }

  const totalPlannedMinutes = stageSource.reduce((sum, stage) => sum + minutesForStage(stage), 0);
  const capacityMinutes = schedule.reduce((sum, day) => sum + day.blocks.reduce((s, block) => s + block.minutes, 0), 0);
  const shortfall = totalPlannedMinutes - capacityMinutes;

  const simulationSchema = z.object({
    summary: z.string(),
    rebalances: z
      .array(z.object({ headline: z.string(), action: z.string() }))
      .min(1)
      .max(4),
    bottlenecks: z.array(z.string()).max(3),
    suggestedTasks: z
      .array(z.object({ title: z.string(), description: z.string(), tags: z.array(z.string()).max(4) }))
      .max(5),
    quizPrompts: z.array(z.string()).max(3),
  });

  const prompt = [
    "You plan a user's workflow using their template.",
    `Goal: ${input.goal}`,
    `Target date: ${target.toISOString().split("T")[0]} • Available ${hoursPerDay}h/day`,
    `Total planned minutes: ${totalPlannedMinutes} • Scheduled capacity: ${capacityMinutes} • Shortfall: ${shortfall > 0 ? shortfall : 0}`,
    "Stages:",
    JSON.stringify(stageSource.map((stage) => ({ title: stage.title, summary: stage.summary, minutes: minutesForStage(stage) })), null, 2),
    "Schedule plan:",
    JSON.stringify(schedule, null, 2),
    "Respond with summary, rebalance suggestions, bottlenecks, auto tasks, and quiz prompts for spaced recall.",
  ].join("\n");

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: simulationSchema,
    prompt,
  });

  const result: WorkflowSimulationResult = {
    schedule,
    summary: object.summary,
    rebalances: object.rebalances,
    bottlenecks: object.bottlenecks,
    suggestedTasks: object.suggestedTasks,
    quizPrompts: object.quizPrompts,
  };

  return { schedule, result, totalMinutes: totalPlannedMinutes };
}
