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
    const result = await agent.run(ctx);
    ctx = result.context;
  }

  return ctx;
}

