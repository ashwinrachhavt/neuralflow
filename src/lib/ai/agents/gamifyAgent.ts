import { generateText } from "ai";
import { z } from "zod";
import { openai } from "../client";
import type { Agent, AgentContext, AgentResult } from "../types";
import { gamificationEngine } from "../../gamification/engine";
import { GEM_META } from "../../gamification/catalog";

export const gamifyAgent: Agent = {
  name: "gamifyAgent",
  description:
    "Awards XP and gems based on user actions using the deterministic gamification engine.",

  async run(ctx: AgentContext): Promise<AgentResult> {
    const { userId, gamification } = ctx;
    if (!userId || !gamification) {
      return { context: ctx };
    }

    const { action, taskId, sessionId } = gamification;
    let engineResult: { shards: any[]; awards: string[] } = { shards: [], awards: [] };

    // 1. Execute Engine Logic
    if (action === "TASK_COMPLETE" && taskId) {
      engineResult = await gamificationEngine.onTaskCompleted(userId, taskId);
    } else if (action === "POMODORO_COMPLETE" && sessionId) {
      engineResult = await gamificationEngine.onPomodoroCompleted(userId, sessionId);
    }

    // 2. Generate Flavor Text (if awards were given)
    let flavorText = "";
    if (engineResult.awards.length > 0) {
      const awardNames = engineResult.awards.map(slug => GEM_META[slug as keyof typeof GEM_META].name).join(", ");
      const { text } = await generateText({
        model: openai("gpt-4.1-mini"),
        prompt: `
User just earned these gems: ${awardNames}.
Action: ${action}.
Write a short, mythic 1-sentence congratulation.
`,
      });
      flavorText = text.trim();
    }

    return {
      context: {
        ...ctx,
        gamifyResult: {
          ...engineResult,
          flavorText,
        },
      },
    };
  },
};

