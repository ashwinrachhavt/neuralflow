"use client";

import { useMutation } from "@tanstack/react-query";

type OrchestratorResponse = {
  ok: boolean;
  context: any; // could import AgentContext if needed
};

type OrchestratorInput = {
  brainDumpText?: string;
  quickTodoText?: string;
  boardId?: string | null;
};

export function useDaoOrchestrator() {
  return useMutation<OrchestratorResponse, Error, OrchestratorInput>({
    mutationFn: async (input) => {
      const res = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.message ?? `Request failed with ${res.status}`);
      }
      return res.json();
    },
  });
}

