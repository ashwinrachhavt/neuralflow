-- Align schema with Tech Spec: timestamps, indexes, AI logging tables

-- PomodoroSession timestamps
ALTER TABLE "PomodoroSession"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- FlashcardDeck updatedAt
ALTER TABLE "FlashcardDeck"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Flashcard updatedAt
ALTER TABLE "Flashcard"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- FlashcardReview updatedAt
ALTER TABLE "FlashcardReview"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Quiz updatedAt
ALTER TABLE "Quiz"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- QuizQuestion timestamps
ALTER TABLE "QuizQuestion"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- QuizAttempt updatedAt
ALTER TABLE "QuizAttempt"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Indexes for common access paths
CREATE INDEX IF NOT EXISTS "Task_boardId_idx" ON "Task" ("boardId");
CREATE INDEX IF NOT EXISTS "Task_columnId_idx" ON "Task" ("columnId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task" ("status");
CREATE INDEX IF NOT EXISTS "Board_userId_idx" ON "Board" ("userId");
CREATE INDEX IF NOT EXISTS "Column_boardId_idx" ON "Column" ("boardId");

-- AI logging tables
CREATE TABLE IF NOT EXISTS "AgentRun" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "route" TEXT,
  "model" TEXT,
  "status" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AgentRun_userId_idx" ON "AgentRun" ("userId");

CREATE TABLE IF NOT EXISTS "AIEvent" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL REFERENCES "AgentRun"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AIEvent_runId_idx" ON "AIEvent" ("runId");

