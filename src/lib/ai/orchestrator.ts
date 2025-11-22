import type { AgentContext, Agent } from "./types";
import { todoAgent } from "./agents/todoAgent";
import { enricherAgent } from "./agents/enricherAgent";
import { gamifyAgent } from "./agents/gamifyAgent";

const PIPELINE: Agent[] = [
  todoAgent,
  enricherAgent,
  gamifyAgent,
  // later: flashcardAgent, quizAgent, analyzerAgent, reporterAgent...
];

export interface OrchestratorInput {
  userId: string;
  brainDumpText?: string;
  quickTodoText?: string;
  boardId?: string;
}

export async function runDaoOrchestrator(input: OrchestratorInput): Promise<AgentContext> {
  // Optionally: log AgentRun/AIEvents to Prisma here

  let ctx: AgentContext = {
    userId: input.userId,
    brainDumpText: input.brainDumpText,
    quickTodoText: input.quickTodoText,
    boardId: input.boardId,
  };

  for (const agent of PIPELINE) {
    const started = Date.now();
    try {
      if (process.env.NODE_ENV !== "production") {
        console.info(`[dao-orchestrator] running agent=${agent.name}`);
      }

      const result = await agent.run(ctx);
      const durationMs = Date.now() - started;

      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[dao-orchestrator] agent=${agent.name} ok durationMs=${durationMs}`,
          {
            keys: Object.keys(result.context ?? {}),
            meta: (result as any)?.context?.meta,
          }
        );
      }

      ctx = result.context;
    } catch (err) {
      const durationMs = Date.now() - started;
      console.error(
        `[dao-orchestrator] agent=${agent.name} failed durationMs=${durationMs}`,
        err
      );
      // Hard fail for now to surface issues during development
      throw err;
    }
  }

  return ctx;
}

import { runAnalyzerAgent } from "./agents/analyzerAgent";
import { runReporterAgent, updateReporterProfile } from "./agents/reporterAgent";
import { prisma } from "../prisma";

export async function runWeeklyReview(userId: string, start: Date, end: Date) {
  // 1. Run Analyzer
  const analyzerResult = await runAnalyzerAgent({
    userId,
    period: "weekly",
    start,
    end,
  });

  // 2. Fetch Profile
  if (!(prisma as any).reporterProfile) {
    console.error("❌ Critical: prisma.reporterProfile is undefined. Keys:", Object.keys(prisma));
    throw new Error("Prisma client is stale and missing ReporterProfile. Please restart the server.");
  }
  const profile = await (prisma as any).reporterProfile.findUnique({
    where: { userId },
  });

  // 3. Run Reporter
  const reporterResult = await runReporterAgent({
    userId,
    metrics: analyzerResult.metrics,
    insights: analyzerResult.insights,
    profile,
  });

  // 4. Update Profile
  await updateReporterProfile({
    userId,
    previousProfile: profile,
    latestMetrics: analyzerResult.metrics,
    latestInsights: analyzerResult.insights,
    latestExperiments: reporterResult.experiments,
  });

  // 5. Log outputs (optional but recommended)
  // We can create an AgentRun record if we want to track this execution
  const run = await prisma.agentRun.create({
    data: {
      userId,
      route: "weekly-review",
      status: "COMPLETED",
      model: "gpt-4.1", // approximate
    },
  });

  await prisma.agentOutput.create({
    data: {
      runId: run.id,
      kind: "reporter:weekly",
      payload: reporterResult as any, // JSON
    },
  });

  return { analyzerResult, reporterResult };
}
