import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from '../config';
import { TASK_TOPICS } from '../taxonomy';

export const CLASSIFIER_SYSTEM_PROMPT = `You are the “TaskCategorizer” agent.
Input: JSON with { title: string, description: string | null }
Output: JSON exactly matching schema (see schema). Do NOT include any other fields.

Topics taxonomy (choose up to 3 that best fit; pick one primary):
- ${TASK_TOPICS.join('\n- ')}

Rules:
- Use title/description only to select topics.
- If unclear, choose “General”.
- Return only JSON (no commentary).`;

export const ClassificationSchema = z.object({
  topics: z
    .array(z.enum(TASK_TOPICS as unknown as [string, ...string[]]))
    .min(1)
    .max(3)
    .default(['General']),
  primaryTopic: z
    .enum(TASK_TOPICS as unknown as [string, ...string[]])
    .default('General'),
  confidence: z.number().min(0).max(1).catch(0.5),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export async function classifyTask(input: {
  title: string;
  description: string | null;
  modelName?: string;
}): Promise<ClassificationResult> {
  const { object } = await generateObject({
    model: textModel(input.modelName),
    schema: ClassificationSchema,
    system: CLASSIFIER_SYSTEM_PROMPT,
    prompt: JSON.stringify({ title: input.title, description: input.description }),
  });
  return object as ClassificationResult;
}
