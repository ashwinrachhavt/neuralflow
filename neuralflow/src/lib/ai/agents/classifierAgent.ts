import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from '../config';

export const CLASSIFIER_SYSTEM_PROMPT = `You are the “CardClassifier” agent.
Input: JSON with { title: string, description: string | null, boardId: string, columnId: string, userId: string, boardColumns: { id:string, name:string }[] }
Output: JSON exactly matching schema:
{
  "suggestedColumnId": string,
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH",
  "suggestedEstimateMin": number,
  "suggestedLabels": string[],
  "confidence": number  // between 0 and 1
}
Rules:
- Use natural language parsing of title/description to infer priority and estimate (e.g., “Prepare for interview” → HIGH, 60 mins).
- Map existing column names/backlog→Todo etc. Prefer mapping by semantic name; return the ID from boardColumns.
- Use board context (columns provided) and any patterns from the title.
Return only JSON (no extra commentary).`;

export const ClassificationSchema = z.object({
  suggestedColumnId: z.string(),
  suggestedPriority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  suggestedEstimateMin: z.number().int().min(5).max(24 * 60).catch(30),
  suggestedLabels: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).catch(0.5),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;

export async function classifyTask(input: {
  title: string;
  description: string | null;
  boardId: string;
  columnId: string;
  userId: string;
  boardColumns: { id: string; name: string }[];
  modelName?: string;
}): Promise<ClassificationResult> {
  const { object } = await generateObject({
    model: textModel(input.modelName),
    schema: ClassificationSchema,
    system: CLASSIFIER_SYSTEM_PROMPT,
    prompt: JSON.stringify({
      title: input.title,
      description: input.description,
      boardId: input.boardId,
      columnId: input.columnId,
      userId: input.userId,
      boardColumns: input.boardColumns,
    }),
  });
  return object as ClassificationResult;
}

