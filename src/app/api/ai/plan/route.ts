import { streamObject } from "ai";
import { z } from "zod";
import { openai } from "@/lib/ai/client";
import { getAgentContext } from "@/lib/ai/context";
import { getUserOr401 } from "@/lib/api-helpers";
import { NextResponse } from "next/server";

const PlanSchema = z.object({
  rationale: z.string().describe("A one-sentence motivation for this schedule based on user energy."),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      estimateMinutes: z.number().min(5).max(120),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
      kind: z
        .enum(["DEEP", "SHALLOW"])
        .describe("Deep work requires focus, Shallow is admin/email"),
    })
  ),
});

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = (await req.json().catch(() => ({}))) as { prompt?: string };
  const prompt = body?.prompt ?? "";
  const context = await getAgentContext((user as any).id);

  const systemMessage = [
    "You are an elite productivity architect.",
    "",
    "CONTEXT:",
    `- Current Time: ${context.currentTime}`,
    `- Energy Profile: ${context.energyProfile}`,
    `- Current Workload: ${context.activeTasks.length} tasks pending.`,
    "",
    "GOAL:",
    "Convert the user's brain dump into a concrete list of tasks.",
    "If the user mentions a specific time, respect it.",
    "Group 'DEEP' work during high-energy periods.",
  ].join("\n");

  try {
    return streamObject({
      model: openai("gpt-4o-mini"),
      schema: PlanSchema,
      system: systemMessage,
      prompt,
    }).toTextStreamResponse();
  } catch (e: any) {
    console.error("Planner stream error:", e?.message ?? e);
    return NextResponse.json({ message: "Planner error" }, { status: 500 });
  }
}
