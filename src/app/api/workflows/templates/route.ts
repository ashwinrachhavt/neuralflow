import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserOr401, readJson } from "@/lib/api-helpers";
import { listWorkflowTemplates, createWorkflowTemplate } from "@/server/db/workflows";
import { prisma } from "@/server/db/client";
import { buildWorkflowAnalyticsSummary } from "@/lib/workflows/mentor";

const templateSchema = z.object({
  title: z.string().min(3),
  summary: z.string().optional(),
  contextTags: z.array(z.string()).optional(),
  triggerExamples: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  stages: z
    .array(
      z.object({
        title: z.string().min(2),
        summary: z.string().optional(),
        expectedDurationMinutes: z.number().int().positive().optional().nullable(),
        artifacts: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        dependencies: z.array(z.string()).optional(),
      }),
    )
    .min(1),
  rationale: z.string().optional(),
  source: z.string().optional(),
});

type TemplateWithStages = Awaited<ReturnType<typeof listWorkflowTemplates>>[number];

function serializeTemplate(template: TemplateWithStages) {
  return {
    id: template.id,
    title: template.title,
    summary: template.summary,
    contextTags: template.contextTags,
    triggerExamples: template.triggerExamples,
    confidence: template.confidence,
    source: template.source,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    stages: template.stages
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((stage) => ({
        id: stage.id,
        title: stage.title,
        summary: stage.summary,
        expectedDurationMinutes: stage.expectedDurationMinutes,
        artifacts: stage.artifacts,
        keywords: stage.keywords,
        dependencies: stage.dependencies,
        position: stage.position,
      })),
  };
}

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const templates = await listWorkflowTemplates((user as any).id);

  const tasks =
    templates.length > 0
      ? await prisma.task.findMany({
          where: { board: { userId: (user as any).id } },
          orderBy: { updatedAt: "desc" },
          take: 120,
          select: {
            id: true,
            title: true,
            descriptionMarkdown: true,
            tags: true,
            priority: true,
            status: true,
            estimatedPomodoros: true,
            estimateMinutes: true,
            updatedAt: true,
            column: { select: { name: true } },
          },
        })
      : [];

  const gems =
    templates.length > 0
      ? await prisma.userStone.findMany({
          where: { userId: (user as any).id },
          orderBy: { earnedAt: "desc" },
          take: 50,
          select: {
            relatedTaskIds: true,
            earnedAt: true,
            stone: { select: { name: true } },
          },
        })
      : [];

  const analytics =
    templates.length > 0
      ? await buildWorkflowAnalyticsSummary({
          templates,
          tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title,
            descriptionMarkdown: task.descriptionMarkdown,
            tags: task.tags,
            priority: task.priority,
            status: task.status,
            estimatedPomodoros: task.estimatedPomodoros,
            estimateMinutes: task.estimateMinutes,
            columnName: task.column?.name ?? null,
            updatedAt: task.updatedAt.toISOString(),
          })),
          gems: gems.map((gem) => ({
            stone: gem.stone.name,
            relatedTaskIds: gem.relatedTaskIds,
            earnedAt: gem.earnedAt.toISOString(),
          })),
        })
      : null;

  return NextResponse.json({ templates: templates.map(serializeTemplate), analytics });
}

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = (await readJson(req)) ?? {};
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const created = await createWorkflowTemplate((user as any).id, {
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    contextTags: parsed.data.contextTags ?? [],
    triggerExamples: parsed.data.triggerExamples ?? [],
    confidence: parsed.data.confidence ?? null,
    source: parsed.data.source ?? "detected",
    lastDetectionRaw: body,
    stages: parsed.data.stages.map((stage) => ({
      title: stage.title,
      summary: stage.summary ?? null,
      expectedDurationMinutes: stage.expectedDurationMinutes ?? null,
      artifacts: stage.artifacts ?? [],
      keywords: stage.keywords ?? [],
      dependencies: stage.dependencies ?? [],
    })),
  });

  return NextResponse.json(serializeTemplate(created));
}
