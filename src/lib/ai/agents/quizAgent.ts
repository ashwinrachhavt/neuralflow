import { generateObject, jsonSchema } from 'ai';
import { textModel } from '../config';

export type Flashcard = { front: string; back: string };
export type Quiz = { question: string; answer: string };

export type QuizGenInput = { markdown: string; modelName?: string };
export type QuizGenOutput = { flashcards: Flashcard[]; questions: Quiz[] };

export const PROMPT = `You are Flow. Create concise flashcards and short-answer quiz questions from notes.`;

const schema = {
  type: 'object',
  properties: {
    flashcards: {
      type: 'array',
      items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'], additionalProperties: false },
      minItems: 3,
      maxItems: 20,
    },
    questions: {
      type: 'array',
      items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'], additionalProperties: false },
      minItems: 3,
      maxItems: 20,
    },
  },
  required: ['flashcards', 'questions'],
  additionalProperties: false,
} as const;

export async function generateQuiz({ markdown, modelName }: QuizGenInput): Promise<QuizGenOutput> {
  const { object } = await generateObject({
    model: textModel(modelName),
    schema: jsonSchema(schema as any),
    system: PROMPT,
    prompt: `Source notes:\n---\n${markdown}\n---\nReturn flashcards and questions matching the schema.`,
  });
  return object as QuizGenOutput;
}

