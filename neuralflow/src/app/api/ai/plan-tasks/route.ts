import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamObject, jsonSchema } from "ai";

import { plannedTaskJsonSchema } from "@/lib/schemas/plan";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  const primaryModel = process.env.AI_MODEL || "gpt-4.1-mini";
  const fallbackModel = "gpt-4.1-mini";

  let result: Awaited<ReturnType<typeof streamObject>> | null = null;
  const basePrompt = `You are Flow, a calm productivity planner.\n\nThe user describes work for TODAY. Return an array of 3–10 planned tasks as JSON matching the schema.\n\nRules:\n- Each task has a concrete title\n- description is short\n- estimateMinutes is a realistic block (20–90)\n- kind = "deep" for heavy thinking, otherwise "shallow"\n- priority = low | medium | high based on urgency implied\n\nUser description:\n"""${prompt}"""`;

  try {
    const { elementStream } = streamObject({
      model: openai(primaryModel),
      output: "array",
      schema: jsonSchema(plannedTaskJsonSchema as any),
      prompt: basePrompt,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const element of elementStream) {
            controller.enqueue(encoder.encode(JSON.stringify(element) + "\n"));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
  } catch {
    try {
      const { elementStream } = streamObject({
        model: openai(fallbackModel),
        output: "array",
        schema: jsonSchema(plannedTaskJsonSchema as any),
        prompt: basePrompt,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const element of elementStream) {
              controller.enqueue(encoder.encode(JSON.stringify(element) + "\n"));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
    } catch {
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

  // unreachable: all return paths are inside the try/catch blocks above
}
