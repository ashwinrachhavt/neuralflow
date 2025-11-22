import { generateText } from 'ai';
import { textModel } from '../config';

export type NoteSummaryInput = { markdown: string; modelName?: string };
export type NoteSummaryOutput = { summary: string; bullets: string[] };

export const PROMPT = `You are Flow. Summarize notes tersely. Use plain language and keep it actionable.`;

export async function summarizeNote({ markdown, modelName }: NoteSummaryInput): Promise<NoteSummaryOutput> {
  const { text } = await generateText({
    model: textModel(modelName),
    system: PROMPT,
    prompt: `Summarize in 2 sentences and list 3 bullets.\n\n---\n${markdown}`,
  });
  const lines = text.trim().split(/\n+/);
  const summary = lines[0] || '';
  const bullets = lines.slice(1).map(s => s.replace(/^[-•]\s?/, '')).filter(Boolean).slice(0, 5);
  return { summary, bullets };
}

