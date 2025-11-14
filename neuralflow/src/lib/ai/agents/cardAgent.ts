import { generateText } from 'ai';
import { textModel } from '../config';

export type CardEnrichInput = { title: string; description?: string; modelName?: string };
export type CardEnrichOutput = { descriptionMarkdown: string };

export const PROMPT = `You are Flow, a helpful assistant that expands short task titles into concise, helpful descriptions.
Write 1–3 sentences of additional context if useful. Keep it crisp.`;

export async function enrichCard({ title, description, modelName }: CardEnrichInput): Promise<CardEnrichOutput> {
  const { text } = await generateText({
    model: textModel(modelName),
    system: PROMPT,
    prompt: `Title: ${title}\nExisting notes: ${description ?? '—'}\n\nWrite a short description:`,
  });
  return { descriptionMarkdown: text.trim() };
}

