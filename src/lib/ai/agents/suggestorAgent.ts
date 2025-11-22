import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from '../config';

export const SUGGEST_SYSTEM_PROMPT = `You are “CardSuggestor”.
Input: JSON:
{
  "task": { id:string, title:string, descriptionMarkdown:string | null, aiSubtasks?: {title:string, estimateMin:number}[] },
  "relatedItems": { type:"note" | "task" | "quiz", id:string, title:string }[],
  "boardColumns": { id:string, name:string }[],
  "userCalendarFreeSlots": { start: string, end:string }[]
}
Output: JSON:
{
  "nextAction": string,
  "shouldMove": boolean,
  "suggestedColumnId": string | null,
  "confidence": number
}
Rules:
- Suggest a clear next action (imperative verb).
- Decide if the card should move columns (e.g., if all subtasks done → move to Review).
- Choose suggestedColumnId accordingly.
Return only JSON.`;

export const SuggestionSchema = z.object({
  nextAction: z.string().min(1).catch('Clarify scope and define first subtask'),
  shouldMove: z.boolean().catch(false),
  suggestedColumnId: z.string().nullable().catch(null),
  confidence: z.number().min(0).max(1).catch(0.5),
});

export type SuggestionResult = z.infer<typeof SuggestionSchema>;

export async function suggestNextAction(input: {
  task: { id: string; title: string; descriptionMarkdown: string | null; aiSubtasks?: { title: string; estimateMin: number }[] | null };
  relatedItems: { type: 'note' | 'task' | 'quiz'; id: string; title: string }[];
  boardColumns: { id: string; name: string }[];
  userCalendarFreeSlots: { start: string; end: string }[];
  modelName?: string;
}): Promise<SuggestionResult> {
  const { object } = await generateObject({
    model: textModel(input.modelName),
    schema: SuggestionSchema,
    system: SUGGEST_SYSTEM_PROMPT,
    prompt: JSON.stringify(input),
  });
  return object as SuggestionResult;
}

