import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  WorkflowAnalyticsSummary,
  WorkflowDetectionResponse,
  WorkflowSimulationResult,
  WorkflowTemplateDTO,
  WorkflowDetectionCandidate,
} from "@/types/workflows";
import { queryKeys } from "@/lib/queryClient";

type TemplatesResponse = {
  templates: WorkflowTemplateDTO[];
  analytics: WorkflowAnalyticsSummary | null;
};

type SaveTemplatePayload = {
  title: string;
  summary?: string;
  contextTags?: string[];
  triggerExamples?: string[];
  confidence?: number;
  stages: WorkflowDetectionCandidate["stages"];
  rationale?: string;
  source?: string;
};

type SimulationPayload = {
  templateId?: string;
  goal: string;
  hoursPerDay?: number;
  targetDate?: string;
};

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const payload = await res.text();
    throw new Error(payload || "Request failed");
  }
  return (await res.json()) as T;
}

export function useWorkflowMemory() {
  return useQuery<TemplatesResponse>({
    queryKey: queryKeys.workflows(),
    queryFn: () => fetchJSON("/api/workflows/templates"),
    staleTime: 1000 * 60,
  });
}

export function useDetectWorkflow() {
  return useMutation<WorkflowDetectionResponse, Error, { limit?: number } | void>({
    mutationFn: (input) =>
      fetchJSON("/api/workflows/templates/detect", {
        method: "POST",
        body: JSON.stringify(input ?? {}),
      }),
  });
}

export function useSaveWorkflowTemplate() {
  const qc = useQueryClient();
  return useMutation<WorkflowTemplateDTO, Error, SaveTemplatePayload>({
    mutationFn: (payload) =>
      fetchJSON("/api/workflows/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.workflows() });
    },
  });
}

export function useWorkflowSimulation() {
  return useMutation<WorkflowSimulationResult, Error, SimulationPayload>({
    mutationFn: (payload) =>
      fetchJSON("/api/workflows/simulate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
