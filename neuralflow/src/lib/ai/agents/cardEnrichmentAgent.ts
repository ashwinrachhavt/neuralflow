import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from '../config';

export const ENRICH_SYSTEM_PROMPT = `You are the “CardEnricher” agent.
Input: JSON with { title: string, descriptionMarkdown: string | null, userRecentTasks: {id:string, title:string, description:string}[] }
Output: JSON:
{
  "descriptionMarkdown": string,
  "subtasks": { title: string, estimateMin: number }[],
  "kind": "deep" | "shallow",
  "confidence": number
}
Rules:
- Expand the task into 3–7 subtasks.
- Estimate each subtask in minutes (20-90 typical).
- If task involves deep thinking/engineering, set kind = deep else shallow.
- Provide expanded description in markdown (2–4 sentences + bullet list of subtasks).
Return only JSON.`;

export const EnrichmentSchema = z.object({
  descriptionMarkdown: z.string().min(1).catch(''),
  subtasks: z
    .array(
      z.object({
        title: z.string(),
        estimateMin: z.number().int().min(5).max(240).catch(30),
      }),
    )
    .min(1)
    .max(10)
    .catch([]),
  kind: z.enum(['deep', 'shallow']).catch('shallow'),
  confidence: z.number().min(0).max(1).catch(0.5),
});

export type EnrichmentResult = z.infer<typeof EnrichmentSchema>;

export async function enrichTask(input: {
  title: string;
  descriptionMarkdown: string | null;
  userRecentTasks: { id: string; title: string; description: string }[];
  modelName?: string;
}): Promise<EnrichmentResult> {
  const { object } = await generateObject({
    model: textModel(input.modelName),
    schema: EnrichmentSchema,
    system: ENRICH_SYSTEM_PROMPT,
    prompt: JSON.stringify({
      title: input.title,
      descriptionMarkdown: input.descriptionMarkdown,
      userRecentTasks: input.userRecentTasks ?? [],
    }),
  });
  return object as EnrichmentResult;
}

