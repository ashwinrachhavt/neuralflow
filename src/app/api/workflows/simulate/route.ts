import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { prisma } from "@/server/db/client";
import { runWorkflowSimulation } from "@/lib/workflows/mentor";
import { recordWorkflowSimulation } from "@/server/db/workflows";

const simulateSchema = z.object({
  templateId: z.string().optional(),
  goal: z.string().min(5),
  targetDate: z.string().optional(),
  hoursPerDay: z.number().min(1).max(10).optional(),
});

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = (await readJson(req)) ?? {};
  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
  if (targetDate && Number.isNaN(targetDate.getTime())) {
    return NextResponse.json({ message: "Invalid targetDate" }, { status: 400 });
  }

  let template: Awaited<ReturnType<typeof prisma.workflowTemplate.findFirst>> | null = null;
  if (parsed.data.templateId) {
    template = await prisma.workflowTemplate.findFirst({
      where: { id: parsed.data.templateId, userId: (user as any).id },
      include: { stages: { orderBy: { position: "asc" } } },
    });
    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }
  }

  const simulation = await runWorkflowSimulation({
    template: template ?? undefined,
    goal: parsed.data.goal,
    targetDate,
    hoursPerDay: parsed.data.hoursPerDay ?? undefined,
  });

  await recordWorkflowSimulation((user as any).id, {
    templateId: template?.id ?? null,
    goal: parsed.data.goal,
    targetDate,
    hoursPerDay: parsed.data.hoursPerDay ?? null,
    totalMinutes: simulation.totalMinutes,
    schedule: simulation.schedule,
    insights: {
      summary: simulation.result.summary,
      rebalances: simulation.result.rebalances,
      bottlenecks: simulation.result.bottlenecks,
    },
    suggestedTasks: simulation.result.suggestedTasks,
  });

  return NextResponse.json(simulation.result);
}
