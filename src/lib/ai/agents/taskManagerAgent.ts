import { generateText } from "ai";
import { openai } from "../client";
import { prismaTools } from "@/lib/agent-tools/prismaTools";
import type { Agent, AgentContext, AgentResult } from "../types";

function summarizeToolResults(toolResults: any[]): string {
  if (!Array.isArray(toolResults) || toolResults.length === 0) {
    return "No tool output available.";
  }

  const lines: string[] = [];
  for (const tr of toolResults) {
    const name = tr.toolName || tr.type || "tool";
    const payload = tr.output ?? tr.result ?? tr;

    if (payload?.task) {
      const t = payload.task;
      lines.push(`Updated task “${t.title ?? t.id}” — status: ${t.status ?? "UPDATED"}.`);
      continue;
    }

    if (Array.isArray(payload?.tasks)) {
      const tasks = payload.tasks as Array<{ title?: string; status?: string; priority?: string }>;
      const count = tasks.length;
      const byStatus = tasks.reduce<Record<string, number>>((acc, t) => {
        const s = (t.status || "UNKNOWN").toString();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      const statusParts = Object.entries(byStatus)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([s, c]) => `${s.toLowerCase().replace(/_/g, " ")}: ${c}`);
      const preview = tasks.slice(0, 5).map((t) => t.title || "(untitled)");
      lines.push(
        `Found ${count} task${count === 1 ? "" : "s"}. ` +
          (statusParts.length ? `Status — ${statusParts.join(", ")}. ` : "") +
          (preview.length ? `Top: ${preview.join(", ")}.` : "")
      );
      continue;
    }

    if (Array.isArray(payload?.events)) {
      const events = payload.events as Array<{ title?: string; type?: string; startAt?: string; endAt?: string }>;
      const count = events.length;
      const byType = events.reduce<Record<string, number>>((acc, e) => {
        const t = (e.type || "UNKNOWN").toString();
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const typeParts = Object.entries(byType)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([t, c]) => `${t.toLowerCase()}: ${c}`);
      const preview = events.slice(0, 5).map((e) => e.title || "(untitled)");
      lines.push(
        `Found ${count} event${count === 1 ? "" : "s"}. ` +
          (typeParts.length ? `Types — ${typeParts.join(", ")}. ` : "") +
          (preview.length ? `Top: ${preview.join(", ")}.` : "")
      );
      continue;
    }

    if (Array.isArray(payload?.stats)) {
      const stats = payload.stats as Array<{ status: string; count: number }>;
      const parts = stats
        .map((s) => `${s.status.toLowerCase().replace(/_/g, " ")}: ${s.count}`)
        .join(", ");
      lines.push(`Task stats — ${parts}.`);
      continue;
    }

    lines.push(`${name} executed.`);
  }

  return lines.join("\n");
}

export const taskManagerAgent: Agent = {
    name: "taskManagerAgent",
    description: "Agent that can query and mutate tasks using Prisma tools.",

    async run(ctx: AgentContext): Promise<AgentResult> {
        const input = ctx.brainDumpText || "List my tasks"; // Default prompt if empty

        const systemPrompt = `
You are a SQL-style data assistant over our Prisma-backed database. You have tools to manage tasks and calendar events.
User ID: ${ctx.userId}

Use the provided tools to fulfill the user's request.
If the user asks to create tasks, use 'createTask'.
If the user asks to update tasks, use 'updateTask'.
If the user asks to list tasks, use 'getUserTodos'.
If the user asks for events (e.g., "events", "calendar"), use 'getUserEvents'.
If the user asks for task stats, use 'runRawStats'.

Always reply with a short natural-language summary of what you did or the data you found. Don't return only tool output.
`;

        const { text, toolCalls, toolResults } = await generateText({
            model: openai("gpt-4.1-mini"), // Or gpt-4o if available/needed
            system: systemPrompt,
            prompt: input,
            tools: prismaTools,
            maxSteps: 5, // Allow multi-step interactions (e.g. find board -> create task)
        });

        // Build a guaranteed natural-language summary if the model didn't produce one
        const fallback = summarizeToolResults(toolResults);
        const nlText = (text && text.trim().length > 0) ? text : fallback;

        // Server-side logging of tool calls for visibility
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            console.info("[PrismaAgent] Tool calls:", toolCalls.map(c => ({ name: c.toolName, input: c.input })));
        }

        return {
            context: {
                ...ctx,
                meta: {
                    ...ctx.meta,
                    taskManagerResult: nlText,
                    toolLog: (toolCalls || []).map((c: any) => ({ name: c.toolName, input: c.input })),
                    toolCalls,
                    toolResults,
                },
            },
            debug: { rawModelOutput: text, toolCalls, toolResults },
        };
    },
};
