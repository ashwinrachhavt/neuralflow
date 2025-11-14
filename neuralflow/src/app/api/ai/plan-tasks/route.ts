import { NextResponse } from "next/server";
import { streamPlan } from "@/lib/ai/agents/plannerAgent";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

export const maxDuration = 30; // seconds

export async function POST(req: Request) {
  // Require an authenticated user for planning
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: "Missing OPENAI_API_KEY" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = (body?.prompt ?? "").trim();

  if (!prompt) {
    return NextResponse.json({ message: "prompt is required" }, { status: 400 });
  }

  // Optional: reject extremely long prompts to protect the model and cost
  if (prompt.length > 4000) {
    return NextResponse.json({ message: "prompt too long" }, { status: 413 });
  }

  try {
    const { elementStream } = streamPlan({ prompt, userId: user.id });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const element of elementStream as AsyncIterable<any>) {
            controller.enqueue(encoder.encode(JSON.stringify(element) + "\n"));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
  } catch (e) {
    const encoder = new TextEncoder();
    const items = mockPlan(prompt);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const item of items) {
          controller.enqueue(encoder.encode(JSON.stringify(item) + "\n"));
          await new Promise(r => setTimeout(r, 80));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
  }
}

function mockPlan(prompt: string) {
  const base = prompt.slice(0, 24) || 'Task';
  return [
    { title: `${base} — outline`, description: 'Draft a short outline', estimateMinutes: 30, kind: 'deep', priority: 'medium' },
    { title: `${base} — first pass`, description: 'Write initial version', estimateMinutes: 45, kind: 'deep', priority: 'high' },
    { title: `${base} — cleanup`, description: 'Polish and finalize', estimateMinutes: 25, kind: 'shallow', priority: 'low' },
  ];
}
