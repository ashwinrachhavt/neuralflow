-- CreateEnum for task status
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED');

-- Create Project table
CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Add status + project to Task
ALTER TABLE "Task"
  ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  ADD COLUMN "projectId" TEXT;

-- Foreign keys
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional backfill: infer Task.status from Column name where possible
UPDATE "Task" t SET "status" = 'BACKLOG'
FROM "Column" c WHERE t."columnId" = c."id" AND lower(c."name") = 'backlog';

UPDATE "Task" t SET "status" = 'TODO'
FROM "Column" c WHERE t."columnId" = c."id" AND lower(c."name") = 'todo';

UPDATE "Task" t SET "status" = 'IN_PROGRESS'
FROM "Column" c WHERE t."columnId" = c."id" AND (lower(c."name") LIKE '%progress%' OR lower(c."name") = 'review' OR lower(c."name") = 'selected');

UPDATE "Task" t SET "status" = 'DONE'
FROM "Column" c WHERE t."columnId" = c."id" AND lower(c."name") IN ('done','complete','completed');

