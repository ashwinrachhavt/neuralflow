import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { textModel, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from '@/lib/ai/config';

export const dynamic = 'force-dynamic';

const Body = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  system: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    const json = await req.json().catch(() => ({}));
    parsed = Body.parse(json);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return NextResponse.json({ message: 'Invalid request', issues: e.issues ?? [] }, { status: 400 });
    }
    return NextResponse.json({ message: 'Bad request' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  try {
    const result = await streamText({
      model: textModel(parsed.model),
      system: parsed.system,
      prompt: parsed.prompt,
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULT_TEMPERATURE,
      maxTokens: typeof parsed.maxTokens === 'number' ? parsed.maxTokens : DEFAULT_MAX_TOKENS,
    });

    // Streams plain text chunks; content-type: text/plain; charset=utf-8
    return result.toTextStreamResponse();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('/api/ai/generate/stream error', err);
    }
    return NextResponse.json({ message: 'Generation failed' }, { status: 500 });
  }
}

