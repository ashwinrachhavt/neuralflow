import { generateText } from "ai";
import { z } from "zod";
import { openai } from "../client";
import type { Agent, AgentContext, AgentResult, TaskDTO } from "../types";

const EnrichedTaskSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  kind: z.enum(["DEEP", "SHALLOW"]),
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

    const prompt = `
You are Dao's task analyzer.

Given a list of tasks, you will:
- classify each as "DEEP" or "SHALLOW"
- assign priority (LOW, MEDIUM, HIGH)
- optionally assign storyPoints (1,2,3,5,8,13)
- add 2–4 tags per task

Return ONLY JSON like:

{
  "tasks": [
    {
      "id": "task-id-or-null",
      "title": "...",
      "description": "...",
      "priority": "HIGH",
      "kind": "DEEP",
      "storyPoints": 3,
      "tags": ["job-search","deep"]
    }
  ]
}

Tasks:
${JSON.stringify(tasks, null, 2)}
`;

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

