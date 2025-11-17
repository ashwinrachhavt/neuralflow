import { streamText } from 'ai';
import { openai } from '@/lib/ai/client';
import { duckDuckGoSearch } from '@/lib/search/duckduckgo';

export const maxDuration = 30;

type AnyMessage = {
  role: 'user' | 'assistant' | 'system' | string;
  content?: string;
  text?: string;
  parts?: Array<{ type: string; text?: string; url?: string }>;
};

function toPlainMessages(msgs: AnyMessage[] = []) {
  return msgs.map((m) => ({
    role: (m.role as any) ?? 'user',
    content:
      typeof m.content === 'string'
        ? m.content
        : typeof m.text === 'string'
        ? m.text
        : Array.isArray(m.parts)
        ? m.parts
            .map((p) => (p.type === 'text' && p.text ? p.text : ''))
            .filter(Boolean)
            .join('\n')
        : '',
  }));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const messages = toPlainMessages((body?.messages ?? []) as AnyMessage[]);
  const webSearch = !!body?.webSearch;
  const modelName = (body?.model as string | undefined) ?? 'gpt-4.1-mini';

  let context = '';
  let sources: { title: string; url: string }[] = [];
  if (webSearch) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUser?.content ?? '';
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

  const system = `You are a concise helpful assistant. If web context is provided, use it and include bracketed citations like [1], [2] mapping to the source list provided.`;

  const result = streamText({
    model: openai(modelName),
    messages,
    system,
    temperature: 0.3,
    maxTokens: 600,
    prompt: context ? `${context}\n\nAnswer:` : undefined,
  });

  const anyResult: any = result as any;
  if (typeof anyResult.toDataStreamResponse === 'function') {
    return anyResult.toDataStreamResponse();
  }
  if (typeof anyResult.toTextStreamResponse === 'function') {
    return anyResult.toTextStreamResponse();
  }
  const rs: ReadableStream | undefined = anyResult.toReadableStream?.();
  if (rs) return new Response(rs, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response('');
}
