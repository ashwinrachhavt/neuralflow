-- Add shard progress table and extend daily snapshot with more metrics

CREATE TABLE IF NOT EXISTS "UserStoneProgress" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stoneId" TEXT NOT NULL REFERENCES "StoneDefinition"("id") ON DELETE CASCADE,
  "currentShards" INTEGER NOT NULL DEFAULT 0,
  "targetShards" INTEGER NOT NULL DEFAULT 10,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserStoneProgress_userId_stoneId_key" UNIQUE ("userId", "stoneId")
);

CREATE INDEX IF NOT EXISTS "UserStoneProgress_userId_idx" ON "UserStoneProgress" ("userId");
CREATE INDEX IF NOT EXISTS "UserStoneProgress_stoneId_idx" ON "UserStoneProgress" ("stoneId");

ALTER TABLE "UserDailySnapshot"
  ADD COLUMN IF NOT EXISTS "highPriorityCompleted" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "deepWorkPomodoros" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reflectionsWritten" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "flashcardsReviewed" INTEGER NOT NULL DEFAULT 0;

