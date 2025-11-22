import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type WorkflowStageCreateInput = {
  title: string;
  summary?: string | null;
  expectedDurationMinutes?: number | null;
  artifacts?: string[];
  keywords?: string[];
  dependencies?: string[];
};

export type WorkflowTemplateCreateInput = {
  title: string;
  summary?: string | null;
  contextTags?: string[];
  triggerExamples?: string[];
  confidence?: number | null;
  source?: string | null;
  lastDetectionRaw?: Prisma.JsonValue | null;
  stages: WorkflowStageCreateInput[];
};

export async function listWorkflowTemplates(userId: string) {
  return prisma.workflowTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      stages: { orderBy: { position: "asc" } },
      simulations: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}

export async function createWorkflowTemplate(userId: string, data: WorkflowTemplateCreateInput) {
  return prisma.workflowTemplate.create({
    data: {
      userId,
      title: data.title,
      summary: data.summary,
      source: data.source ?? "detected",
      contextTags: data.contextTags ?? [],
      triggerExamples: data.triggerExamples ?? [],
      confidence: data.confidence ?? null,
      lastDetectionRaw: data.lastDetectionRaw ?? null,
      stages: {
        create: data.stages.map((stage, idx) => ({
          title: stage.title,
          summary: stage.summary ?? null,
          expectedDurationMinutes: stage.expectedDurationMinutes ?? null,
          artifacts: stage.artifacts ?? [],
          keywords: stage.keywords ?? [],
          dependencies: stage.dependencies ?? [],
          position: idx,
        })),
      },
    },
    include: {
      stages: { orderBy: { position: "asc" } },
      simulations: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}

export type WorkflowSimulationRecordInput = {
  templateId?: string | null;
  goal: string;
  targetDate?: Date | null;
  hoursPerDay?: number | null;
  totalMinutes?: number | null;
  schedule?: Prisma.JsonValue | null;
  insights?: Prisma.JsonValue | null;
  suggestedTasks?: Prisma.JsonValue | null;
};

export async function recordWorkflowSimulation(userId: string, input: WorkflowSimulationRecordInput) {
  return prisma.workflowSimulation.create({
    data: {
      userId,
      templateId: input.templateId ?? null,
      goal: input.goal,
      targetDate: input.targetDate ?? null,
      hoursPerDay: input.hoursPerDay ?? null,
      totalMinutes: input.totalMinutes ?? null,
      schedule: input.schedule ?? null,
      insights: input.insights ?? null,
      suggestedTasks: input.suggestedTasks ?? null,
    },
  });
}
