import { stepCountIs, streamText } from 'ai';
import { openai } from '@/lib/ai/client';
import { getTools } from '@/lib/ai/tools';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { messages?: any[] };
  const messages = body.messages ?? [];
  const tools = await getTools();

  return streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools,
    stopWhen: stepCountIs(5),
    system:
      'You are a concise productivity assistant. You help the user manage their board. Do not be chatty; just do the work.',
  }).toTextStreamResponse();
}
