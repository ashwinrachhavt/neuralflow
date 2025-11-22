import { embed, embedMany } from 'ai';
import { embeddingModel } from './config';

export type EmbeddingVector = number[];

export async function embedText(text: string, modelName?: string): Promise<EmbeddingVector> {
  const { embedding } = await embed({ model: embeddingModel(modelName), value: text });
  return embedding;
}

export async function embedTexts(texts: string[], modelName?: string): Promise<EmbeddingVector[]> {
  const { embeddings } = await embedMany({ model: embeddingModel(modelName), values: texts });
  return embeddings;
}

