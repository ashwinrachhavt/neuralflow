import { createOpenAI } from '@ai-sdk/openai';

export const DEFAULT_TEXT_MODEL = process.env.AI_MODEL || 'gpt-4.1-mini';
export const STRONG_TEXT_MODEL = process.env.AI_MODEL_STRONG || 'gpt-4.1';
export const DEFAULT_EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';

export const DEFAULT_TEMPERATURE = Number(process.env.AI_TEMPERATURE ?? 0.2);
export const DEFAULT_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS ?? 1024);

export const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function textModel(name?: string) {
  return openai(name ?? DEFAULT_TEXT_MODEL);
}

export function embeddingModel(name?: string) {
  return openai.embedding(name ?? DEFAULT_EMBEDDING_MODEL);
}

