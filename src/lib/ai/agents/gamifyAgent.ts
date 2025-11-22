import { generateText } from "ai";
import { z } from "zod";
import { openai } from "../client";
import type { Agent, AgentContext, AgentResult, GemAward, TaskDTO } from "../types";

// Placeholder catalog; you can pull this from Prisma later
const GEM_CATALOG = [
  { slug: "obsidian-focus", imageUrl: "/gems/obsidian.png" },
  { slug: "sapphire-consistency", imageUrl: "/gems/sapphire.png" },
  { slug: "ruby-shipping", imageUrl: "/gems/ruby.png" },
];

const GemSchema = z.object({
  slug: z.string(),
  title: z.string(),
  oneLineLore: z.string(),
  relatedTaskIds: z.array(z.string()).default([]),
});

const GamifyOutputSchema = z.object({
  awards: z.array(GemSchema),
  rationale: z.string().optional(),
});

export const gamifyAgent: Agent = {
  name: "gamifyAgent",
  description:
    "Look at today’s tasks + patterns and award 0–3 gems that reflect meaningful achievements.",

  async run(ctx: AgentContext): Promise<AgentResult> {
    const tasks: TaskDTO[] = ctx.enrichedTasks ?? ctx.generatedTasks ?? [];
    if (tasks.length === 0) return { context: ctx };

    const prompt = `
You are Dao's lore master and gamification designer.

Today’s tasks:
${JSON.stringify(tasks, null, 2)}

Gem catalog:
${JSON.stringify(GEM_CATALOG, null, 2)}

Rules:
- Award 0–3 gems PER CALL.
- Only award a gem if behavior is meaningful.
- Use provided slugs; invent human-friendly titles and lore.

Return ONLY JSON like:
{
  "awards": [
    {
      "slug": "obsidian-focus",
      "title": "Obsidian Focus",
      "oneLineLore": "Forged focus from scattered hours.",
      "relatedTaskIds": ["task-id-1"]
    }
  ],
  "rationale": "..."
}`;

    const { text } = await generateText({
      model: openai("gpt-4.1-mini"),
      prompt,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}$/);
    const json = jsonMatch ? jsonMatch[0] : "{}";
    const parsed = GamifyOutputSchema.safeParse(JSON.parse(json));

    if (!parsed.success) {
      console.error("gamifyAgent parse error", parsed.error);
      return { context: ctx, debug: { raw: text } };
    }

    const awards: GemAward[] = parsed.data.awards.map((a) => {
      const base = GEM_CATALOG.find((g) => g.slug === a.slug);
      return {
        slug: a.slug,
        title: a.title,
        oneLineLore: a.oneLineLore,
        imageUrl: base?.imageUrl ?? "/gems/default.png",
        relatedTaskIds: a.relatedTaskIds,
      };
    });

    return {
      context: {
        ...ctx,
        gemAwards: awards,
        meta: { ...ctx.meta, gamifyRationale: parsed.data.rationale },
      },
      debug: { rawModelOutput: text },
    };
  },
};

