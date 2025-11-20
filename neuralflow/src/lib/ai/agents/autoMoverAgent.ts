import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from '../config';

export const AUTOMOVE_SYSTEM_PROMPT = `You are “CardAutoMover”.
Input: JSON:
{
  "task": { id:string, columnId:string, aiState:string, aiConfidence:number | null, updatedAt:string, lastUserInteractionAt?:string | null },
  "boardColumns": { id:string, name:string }[]
}
Output: JSON:
{
  "move": boolean,
  "targetColumnId": string | null
}
Rules:
- If aiState == SUGGESTED and aiConfidence > 0.8 and columnId != target → set move true.
- If updatedAt older than 7 days and column is Backlog → consider move to Todo.
Return only JSON.`;

export const AutoMoveSchema = z.object({
  move: z.boolean().catch(false),
  targetColumnId: z.string().nullable().catch(null),
});

export type AutoMoveResult = z.infer<typeof AutoMoveSchema>;

export async function autoMoveDecision(input: {
  task: { id: string; columnId: string; aiState: string | null; aiConfidence: number | null; updatedAt: string; lastUserInteractionAt?: string | null };
  boardColumns: { id: string; name: string }[];
  modelName?: string;
}): Promise<AutoMoveResult> {
  const { object } = await generateObject({
    model: textModel(input.modelName),
    schema: AutoMoveSchema,
    system: AUTOMOVE_SYSTEM_PROMPT,
    prompt: JSON.stringify(input),
  });
  return object as AutoMoveResult;
}

