-- Task typing, gamification primitives, analytics snapshots, and agent outputs

CREATE TYPE "TaskType" AS ENUM ('DEEP_WORK', 'SHALLOW_WORK', 'LEARNING', 'SHIP', 'MAINTENANCE');

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "type" "TaskType",
  ADD COLUMN IF NOT EXISTS "storyPoints" INTEGER,
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "aiPlanned" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "fromBrainDump" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "source" TEXT;

CREATE TYPE "StoneRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

CREATE TABLE IF NOT EXISTS "StoneDefinition" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "imagePath" TEXT NOT NULL,
  "rarity" "StoneRarity" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "UserStone" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stoneId" TEXT NOT NULL REFERENCES "StoneDefinition"("id") ON DELETE CASCADE,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "source" TEXT,
  "relatedTaskIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "note" TEXT
);

CREATE INDEX IF NOT EXISTS "UserStone_userId_idx" ON "UserStone" ("userId");
CREATE INDEX IF NOT EXISTS "UserStone_stoneId_idx" ON "UserStone" ("stoneId");

CREATE TABLE IF NOT EXISTS "UserGamificationProfile" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "longestDailyStreak" INTEGER NOT NULL DEFAULT 0,
  "currentDailyStreak" INTEGER NOT NULL DEFAULT 0,
  "lastActivityDate" TIMESTAMP(3),
  "totalTasksCompleted" INTEGER NOT NULL DEFAULT 0,
  "totalDeepWorkBlocks" INTEGER NOT NULL DEFAULT 0,
  "totalPomodoros" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserGamificationProfile_userId_key" UNIQUE ("userId")
);

CREATE TABLE IF NOT EXISTS "AchievementDefinition" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "achievementId" TEXT NOT NULL REFERENCES "AchievementDefinition"("id") ON DELETE CASCADE,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "metadata" JSONB
);

CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement" ("userId");
CREATE INDEX IF NOT EXISTS "UserAchievement_achievementId_idx" ON "UserAchievement" ("achievementId");

CREATE TABLE IF NOT EXISTS "UserDailySnapshot" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "date" TIMESTAMP(3) NOT NULL,
  "tasksCreated" INTEGER NOT NULL DEFAULT 0,
  "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
  "deepWorkTasks" INTEGER NOT NULL DEFAULT 0,
  "shallowTasks" INTEGER NOT NULL DEFAULT 0,
  "learningTasks" INTEGER NOT NULL DEFAULT 0,
  "pomodoroCount" INTEGER NOT NULL DEFAULT 0,
  "focusMinutes" INTEGER NOT NULL DEFAULT 0,
  "quizAttempts" INTEGER NOT NULL DEFAULT 0,
  "avgQuizScore" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserDailySnapshot_userId_date_key" UNIQUE ("userId", "date")
);

CREATE INDEX IF NOT EXISTS "UserDailySnapshot_userId_idx" ON "UserDailySnapshot" ("userId");

CREATE TABLE IF NOT EXISTS "AgentOutput" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL REFERENCES "AgentRun"("id") ON DELETE CASCADE,
  "kind" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AgentOutput_runId_idx" ON "AgentOutput" ("runId");
