import { streamText } from 'ai';
import { openai } from '@/lib/ai/client';
import { duckDuckGoSearch } from '@/lib/search/duckduckgo';

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const messages = body?.messages ?? [];
  const web = !!body?.webSearch;
  const modelName = (body?.model as string | undefined) ?? 'gpt-4.1-mini';

  let context = '';
  let sources: { title: string; url: string }[] = [];
  if (web) {
    const last = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? '';
    const query = typeof last === 'string' ? last : (Array.isArray(last) ? last.map((p: any) => p.text || '').join(' ') : '');
    if (query) {
      try {
        sources = await duckDuckGoSearch(query, 5);
        if (sources.length) {
          context = `Web results for "${query}":\n` + sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join('\n');
        }
      } catch {
        // ignore search errors
      }
    }
  }

  const system = `You are a concise helpful assistant. If web context is provided, use it and include bracketed citations like [1], [2] mapping to the source list provided.
Provide direct answers. Keep formatting simple.`;

  const result = streamText({
    model: openai(modelName),
    messages: messages.map((m: any) => ({ role: m.role, content: m.content ?? m.text ?? '' })),
    system,
    maxTokens: 500,
    temperature: 0.3,
    experimental_providerMetadata: context ? { webContext: context } : undefined,
    // prepend context for model to use
    prompt: context ? `${context}\n\nAnswer:` : undefined,
  });

  return result.toDataStreamResponse();
}

