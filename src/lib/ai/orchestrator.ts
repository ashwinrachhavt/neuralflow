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
