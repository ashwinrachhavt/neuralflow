import { streamText } from 'ai';
import { textModel } from '../config';
export type PlannedTask = never;
import { logAgentRunStart, logAgentRunFinish } from '@/server/db/agentRuns';

export type PlannerInput = {
  prompt: string;
  userId?: string;
  modelName?: string;
};

export const PROMPT = `You are Flow, a calm productivity assistant.

The user describes work for TODAY. Return an array of 3–10 planned tasks as JSON matching the schema.

Rules:
- Each task has a concrete title
- description is short
- estimateMinutes is a realistic block (20–90)
- kind = "deep" for heavy thinking, otherwise "shallow"
- priority = low | medium | high based on urgency implied
`;

export function streamPlan({ prompt, userId, modelName }: PlannerInput) {
  const fullPrompt = `${PROMPT}\nUser description:\n"""${prompt}"""`;
  const startedAt = Date.now();
  const runPromise = logAgentRunStart({ userId, type: 'planner', model: modelName }).catch(() => null);

  const { textStream } = streamText({ model: textModel(modelName), prompt: fullPrompt });
  const stream = (async function* () {
    try {
      for await (const chunk of textStream) {
        yield chunk;
      }
      const run = await runPromise;
      await logAgentRunFinish({
        runId: run?.id,
        status: 'ok',
        durationMs: Date.now() - startedAt,
        output: { },
      }).catch(() => {});
    } catch (e: any) {
      const run = await runPromise;
      await logAgentRunFinish({
        runId: run?.id,
        status: 'error',
        durationMs: Date.now() - startedAt,
        error: e?.message ?? String(e),
      }).catch(() => {});
      throw e;
    }
  })();

  return { elementStream: stream };
}
