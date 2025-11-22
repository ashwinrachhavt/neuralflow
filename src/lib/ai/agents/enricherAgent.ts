import { generateText } from "ai";
import { z } from "zod";
import { openai } from "../client";
import type { Agent, AgentContext, AgentResult, TaskDTO } from "../types";

const EnrichedTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  kind: z.enum(["DEEP", "SHALLOW"]).describe("Binary deep/shallow classification"),
  depthScore: z.number().min(0).max(1).optional().describe("0..1 where 1 is deepest work"),
  storyPoints: z.number().int().min(1).max(13).optional(),
  tags: z.array(z.string()).optional(),
});

const EnricherOutputSchema = z.object({
  tasks: z.array(EnrichedTaskSchema),
});

export const enricherAgent: Agent = {
  name: "enricherAgent",
  description: "Classify tasks into deep/shallow, assign priority and story points.",

  async run(ctx: AgentContext): Promise<AgentResult> {
    const tasks = ctx.generatedTasks ?? ctx.enrichedTasks;
    if (!tasks || tasks.length === 0) return { context: ctx };

    const guidelines = `
Deep vs Shallow (binary, with depthScore 0..1):
- DEEP: cognitively demanding, requires sustained focus, creates new value (design doc, algorithm, implementing feature, studying complex topic). Typically > 25–50 minutes of uninterrupted work. Often involves problem-solving, writing, architecture, learning.
- SHALLOW: logistical or administrative; low-friction execution (email, scheduling, formatting, filing, small cleanup, trivial edits). Generally < 25 minutes; can be interrupted without large cost.

Heuristics (non-binding):
- Mentions like "email", "schedule", "book", "format", "cleanup", "organize", "sync" → SHALLOW.
- "write", "implement", "debug", "design", "refactor", "study", "research", "practice" → DEEP.
- estimatedPomodoros ≥ 2 or estimateMinutes ≥ 50 suggests DEEP; 0–1 suggests SHALLOW.
- Tags like ["deep"] or ["admin"] can bias accordingly.

Output requirements:
- Provide both binary kind and a depthScore (0..1). depthScore near 1 → very deep; near 0 → very shallow.
- Keep titles unchanged; copy description when available.
- Priorities: HIGH when time-sensitive/critical; MEDIUM default.
- Add 2–4 tags (lowercase kebab-case) that reflect the nature (e.g., "deep", "admin", "learning", "shipping").
`;

    const prompt = `You are Dao's task analyzer. Follow the guidelines strictly.

GUIDELINES:\n${guidelines}\n\nTasks:\n${JSON.stringify(tasks, null, 2)}\n\nReturn ONLY JSON like:\n{
  "tasks": [
    {
      "id": "task-id-or-null",
      "title": "...",
      "description": "...",
      "priority": "HIGH",
      "kind": "DEEP",
      "depthScore": 0.82,
      "storyPoints": 3,
      "tags": ["learning","deep"]
    }
  ]
}`;

    const { text } = await generateText({
      model: openai("gpt-4.1-mini"),
      prompt,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}$/);
    const json = jsonMatch ? jsonMatch[0] : "{}";
    const parsed = EnricherOutputSchema.safeParse(JSON.parse(json));

    if (!parsed.success) {
      console.error("enricherAgent parse error", parsed.error);
      return { context: ctx, debug: { raw: text } };
    }

    const enriched: TaskDTO[] = parsed.data.tasks.map((t) => ({
      ...(t.id ? tasks.find((orig) => orig.id === t.id) : {}),
      title: t.title,
      descriptionMarkdown: t.description ?? "",
      priority: t.priority,
      tags: t.tags ?? [],
      kind: t.kind,
      depthScore: typeof t.depthScore === 'number' ? t.depthScore : undefined,
    }));

    return {
      context: {
        ...ctx,
        enrichedTasks: enriched,
      },
      debug: { rawModelOutput: text },
    };
  },
};
