import { NextResponse } from "next/server";
import { generateText } from "ai";
import { textModel, DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS } from "@/lib/ai/config";
import { z } from "zod";

const BodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  system: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));
    const { prompt, system, model, temperature, maxTokens } = BodySchema.parse(raw);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ message: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const { text } = await generateText({
      model: textModel(model),
      system,
      prompt,
      temperature: typeof temperature === "number" ? temperature : DEFAULT_TEMPERATURE,
      maxTokens: typeof maxTokens === "number" ? maxTokens : DEFAULT_MAX_TOKENS,
    });

    return NextResponse.json({ text });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return NextResponse.json({ message: "Invalid request", issues: err?.issues ?? [] }, { status: 400 });
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("/api/ai/generate error", err);
    }
    return NextResponse.json({ message: "Generation failed" }, { status: 500 });
  }
}
