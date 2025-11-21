-- AI state enum and task intelligence fields

-- CreateEnum
CREATE TYPE "AiState" AS ENUM ('RAW', 'CLASSIFIED', 'ENRICHED', 'SUGGESTED', 'COMPLETED');

-- AlterTable: add AI columns to Task
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "aiSuggestedColumnId" TEXT,
  ADD COLUMN IF NOT EXISTS "aiSuggestedPriority" "TaskPriority",
  ADD COLUMN IF NOT EXISTS "aiSuggestedEstimateMin" INTEGER,
  ADD COLUMN IF NOT EXISTS "aiSubtasks" JSONB,
  ADD COLUMN IF NOT EXISTS "aiNextAction" TEXT,
  ADD COLUMN IF NOT EXISTS "aiState" "AiState" NOT NULL DEFAULT 'RAW',
  ADD COLUMN IF NOT EXISTS "aiConfidence" DOUBLE PRECISION;

