import type { Prisma } from "@prisma/client";

export const TASK_TYPES = [
  "DEEP_WORK",
  "SHALLOW_WORK",
  "LEARNING",
  "SHIP",
  "MAINTENANCE",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const STONE_RARITIES = ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const;

export type StoneRarity = (typeof STONE_RARITIES)[number];

export const ORCHESTRATOR_INTENTS = [
  "plan_day",
  "daily_reflect",
  "study_block",
  "weekly_review",
] as const;

export type OrchestratorIntent = (typeof ORCHESTRATOR_INTENTS)[number];

export interface PlannedTaskSummary {
  title: string;
  descriptionMarkdown: string;
  type: TaskType;
  storyPoints: number;
  priority: Prisma.TaskPriority;
  dueDate?: string;
  tags?: string[];
}

export interface TodoAgentResult {
  tasks: PlannedTaskSummary[];
  rationale: string;
  suggestedFocusMinutes?: number;
}

export interface TaskEnrichmentResult {
  taskId: string;
  type: TaskType;
  storyPoints: number;
  tags: string[];
  subtasks: string[];
  rationale: string;
}

export interface FlashcardAgentCard {
  question: string;
  answer: string;
  context?: string;
}

export interface FlashcardAgentResult {
  deckTitle: string;
  sourceNoteId?: string;
  cards: FlashcardAgentCard[];
  summary?: string;
}

export interface QuizAgentQuestion {
  type: Prisma.QuestionType;
  promptMarkdown: string;
  options?: string[];
  correctAnswer?: string | string[];
  rubric?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}

export interface QuizAgentResult {
  title: string;
  description?: string;
  questions: QuizAgentQuestion[];
}

export interface GamifyStoneAward {
  stoneSlug: string;
  reason: string;
  relatedTaskIds?: string[];
}

export interface GamifyAchievementAward {
  achievementSlug: string;
  note?: string;
}

export interface GamifyAgentResult {
  xpDelta: number;
  levelAfter: number;
  streakAfter: number;
  stones: GamifyStoneAward[];
  achievements: GamifyAchievementAward[];
  notifications: string[];
}

export interface AnalyzerMetricSummary {
  period: "daily" | "weekly";
  startIso: string;
  endIso: string;
  aggregates: Record<string, number>;
  tagBreakdown?: Record<string, number>;
}

export interface AnalyzerInsight {
  title: string;
  insight: string;
  evidence: string;
  suggestion?: string;
}

export interface AnalyzerAgentResult {
  metrics: AnalyzerMetricSummary;
  insights: AnalyzerInsight[];
}

export interface ReporterExperiment {
  title: string;
  description: string;
  expectedImpact?: string;
}

export interface ReporterAgentResult {
  summary: string;
  highlights: string[];
  improvementIdeas: string[];
  experiments: ReporterExperiment[];
  sentiment?: "CALM" | "FOCUSED" | "STRETCHED" | "RECOVER";
}

export interface AgentOutputEnvelope<TPayload = unknown> {
  runId: string;
  kind: string;
  payload: TPayload;
  createdAt: string;
}

export interface OrchestratorEvent {
  intent: OrchestratorIntent;
  trigger: "manual" | "scheduled" | "webhook";
  payload?: Record<string, unknown>;
}
