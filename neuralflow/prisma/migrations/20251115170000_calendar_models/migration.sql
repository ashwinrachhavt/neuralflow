-- Calendar models
CREATE TYPE "EventType" AS ENUM ('FOCUS','MEETING','PERSONAL','BREAK');

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "type" "EventType" NOT NULL DEFAULT 'FOCUS',
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "descriptionMarkdown" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "location" TEXT,
  "relatedTaskId" TEXT REFERENCES "Task"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "CalendarEvent_user_start_idx" ON "CalendarEvent" ("userId","startAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_user_end_idx" ON "CalendarEvent" ("userId","endAt");

CREATE TABLE IF NOT EXISTS "FocusSession" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "eventId" TEXT REFERENCES "CalendarEvent"("id") ON DELETE SET NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "interruptions" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "FocusSession_user_idx" ON "FocusSession" ("userId");
CREATE INDEX IF NOT EXISTS "FocusSession_event_idx" ON "FocusSession" ("eventId");
