export type WorkflowStageDTO = {
  id?: string;
  title: string;
  summary?: string | null;
  expectedDurationMinutes?: number | null;
  artifacts?: string[];
  keywords?: string[];
  dependencies?: string[];
  position?: number;
};

export type WorkflowTemplateDTO = {
  id: string;
  title: string;
  summary?: string | null;
  contextTags: string[];
  triggerExamples: string[];
  confidence?: number | null;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  stages: WorkflowStageDTO[];
};

export type WorkflowDetectionCandidate = {
  title: string;
  summary?: string;
  contextTags: string[];
  triggerExamples: string[];
  confidence: number;
  rationale: string;
  stages: WorkflowStageDTO[];
  matchedTaskIds: string[];
};

export type WorkflowDetectionResponse = {
  detected: boolean;
  candidate?: WorkflowDetectionCandidate;
  reason?: string;
};

export type WorkflowAnalyticsCallout = {
  templateId: string;
  headline: string;
  imbalance: string;
  action: string;
};

export type WorkflowAnalyticsSummary = {
  summary: string;
  perTemplate: WorkflowAnalyticsCallout[];
  globalAdvice: string[];
};

export type WorkflowSimulationBlock = {
  stageTitle: string;
  minutes: number;
  focus: string;
  dayFraction?: number;
};

export type WorkflowSimulationDay = {
  dateLabel: string;
  blocks: WorkflowSimulationBlock[];
};

export type WorkflowSimulationResult = {
  schedule: WorkflowSimulationDay[];
  summary: string;
  rebalances: { headline: string; action: string }[];
  bottlenecks: string[];
  suggestedTasks: { title: string; description: string; tags: string[] }[];
  quizPrompts: string[];
};

export type WorkflowSimulationPayload = {
  templateId?: string;
  goal: string;
  targetDate?: string;
  hoursPerDay?: number;
};
