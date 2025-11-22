import { PrismaClient, ProjectStatus, TaskPriority, TaskStatus, TaskType } from "@prisma/client";

const prisma = new PrismaClient();

const BOARD_ID = "board_command_center";
const COLUMN_DEFS: ColumnSeed[] = [
  { key: "backlog", id: "col_command_backlog", name: "Backlog", position: 0 },
  { key: "focus", id: "col_command_focus", name: "Focus Block", position: 1 },
  { key: "build", id: "col_command_build", name: "Build", position: 2 },
  { key: "review", id: "col_command_review", name: "Review", position: 3 },
  { key: "done", id: "col_command_done", name: "Done", position: 4 },
];

const PROJECTS: ProjectSeed[] = [
  {
    slug: "neuralflow",
    title: "Neural Flow",
    description: "Focus-first productivity command center with docs + boards + AI.",
    status: ProjectStatus.ACTIVE,
    points: 34,
    notionUrl: "https://www.notion.so/ashwin/Neural-Flow-Command-Center-58e53cf4c92a4b5e8c1a56a1a6561c7f",
  },
  {
    slug: "nextjs-ai-db-learning",
    title: "Next.js + AI + Databases Learning",
    description: "Long-form study notes for Next.js, Prisma, PlanetScale, and LLM infra.",
    status: ProjectStatus.ACTIVE,
    points: 18,
    notionUrl: "https://www.notion.so/ashwin/Learning-Stack-Next-js-AI-Databases-5d7bc9d754414986a996e035ef2d9ad5",
  },
  {
    slug: "valon-interview",
    title: "Valon / Interview Prep",
    description: "Interview drills, scorecards, and system design prompts inspired by Valon.",
    status: ProjectStatus.HOLD,
    points: 8,
    notionUrl: "https://www.notion.so/ashwin/Valon-Loop-Interview-Prep-3d9f1b4ad9c148208f1582255128c4aa",
  },
];

const DOCS: DocSeed[] = [
  {
    slug: "neural-flow-vision",
    projectSlug: "neuralflow",
    title: "Neural Flow Vision",
    summary: "Why a focus-first OS matters, the rituals we enforce, and how AI copilots the flow.",
    notionUrl: "https://www.notion.so/ashwin/Neural-Flow-Vision-6bf464b9f6c94fc7b48e5aef4f15a836",
    contentMarkdown: `## Intent
Describe the future of Neural Flow as a command center that keeps deep work sacred.

## Pillars
- Focus-first boards with enforced single task mode.
- Docs that stay side-by-side with tasks for instant context.
- Neural cues (energy, tempo, wins) that inform what to pick next.

## Signals Of Success
1. Daily ritual: open Neural Flow, pick a doc-backed focus item, hit play.
2. Copilot knows which doc (vision, plan, PRD) to surface when a task opens.
3. Ambient metrics: focus minutes, shipped points, reduced tab hopping.
`,
  },
  {
    slug: "neural-flow-performance-plan",
    projectSlug: "neuralflow",
    title: "Neural Flow Performance Plan",
    summary: "Budget for skeletons, streaming, and zero-jank context panes.",
    notionUrl: "https://www.notion.so/ashwin/Neural-Flow-Performance-Plan-9ddc4c57e0ff425993255541113ad7f2",
    contentMarkdown: `## Budget Guards
- 100ms perceived switch between tasks + docs.
- Zero layout shift when command center opens AI docks.
- Stream every long-running AI completion.

## Playbook
1. Audit every loading state, add skeletons + optimistic data.
2. Co-locate data dependencies and prefetch doc content.
3. Stress test with concurrent AI runs + focus timer playback.
`,
  },
  {
    slug: "prisma-orms-notes",
    projectSlug: "nextjs-ai-db-learning",
    title: "Prisma & ORMs – Learning Notes",
    summary: "Working notes on Prisma Client patterns, seeding, and schema discipline.",
    notionUrl: "https://www.notion.so/ashwin/Prisma-ORMs-Learning-Notes-cbf173c9832245caa21c4cf7f9d5bf22",
    contentMarkdown: `## Why Prisma
- Type-safe edge between app logic and Postgres.
- Schema as the single source of truth (migrations, zod, UI).

## Patterns Captured
1. Seed scripts mirror Notion command centers.
2. Repository helpers wrap Prisma for future multi-tenant rules.
3. Doc links allow tasks to hydrate context on demand.
`,
  },
  {
    slug: "planetscale-db-notes",
    projectSlug: "nextjs-ai-db-learning",
    title: "PlanetScale DB Notes",
    summary: "Branching, shadow tables, and how staging promotes to prod without downtime.",
    notionUrl: "https://www.notion.so/ashwin/PlanetScale-DB-Notes-a51c3623a8974b34a03bd54b68edc9d1",
    contentMarkdown: `## Branching Model
- Main stays pristine; create feature branches per major migration.
- Use deploy requests to gate destructive DDL.

## Operational Reminders
1. Enable safe migrations (plan + apply) for Prisma.
2. Keep a staging branch synced with nightly prod snapshots.
3. Test PlanetScale connection pooling with k6 before launch.
`,
  },
  {
    slug: "valon-interview-tactical",
    projectSlug: "valon-interview",
    title: "Valon Interview Tactical Prep",
    summary: "System design + product prompts tailored to Valon's mortgage ops.",
    notionUrl: "https://www.notion.so/ashwin/Valon-Interview-Tactical-Prep-f31898a9770f4d329c54c00168ad6394",
    contentMarkdown: `## Core Stories
- Automate borrower updates with AI summarization loops.
- Build an internal focus board for ops agents.

## Mock Agenda
1. 5 min warm-up: recent wins, learnings from Neural Flow.
2. 35 min system design with PlanetScale + worker queue.
3. 10 min deep dive on focus rituals and doc strategy.
`,
  },
];

const TASKS: TaskSeed[] = [
  {
    id: "task_nf_focus_flow",
    title: "Implement focus-first task flow",
    descriptionMarkdown:
      "Pin a single task, auto-collapse other cards, and dock the Neural Flow Vision doc next to it.",
    columnKey: "focus",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    type: TaskType.DEEP_WORK,
    estimateMinutes: 240,
    storyPoints: 8,
    tags: ["neuralflow", "focus"],
    projectSlug: "neuralflow",
    docSlug: "neural-flow-vision",
    dueDate: "2025-01-17T15:00:00.000Z",
  },
  {
    id: "task_nf_performance_budget",
    title: "Ship performance guardrails",
    descriptionMarkdown: "Add route-level skeletons, streaming AI output, and flame-chart the doc sidebar.",
    columnKey: "build",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: TaskType.SHIP,
    estimateMinutes: 180,
    storyPoints: 5,
    tags: ["neuralflow", "performance"],
    projectSlug: "neuralflow",
    docSlug: "neural-flow-performance-plan",
    dueDate: "2025-01-20T18:00:00.000Z",
  },
  {
    id: "task_learning_prisma_notes",
    title: "Polish Prisma learning notes",
    descriptionMarkdown: "Summarize migrations, seeding best practices, and doc linkage examples.",
    columnKey: "review",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: TaskType.LEARNING,
    estimateMinutes: 90,
    storyPoints: 3,
    tags: ["learning", "prisma"],
    projectSlug: "nextjs-ai-db-learning",
    docSlug: "prisma-orms-notes",
    dueDate: "2025-01-22T17:00:00.000Z",
  },
  {
    id: "task_planetscale_branch",
    title: "Set up PlanetScale staging branch",
    descriptionMarkdown: "Create staging branch, run safe migrations, and connect the Next.js preview env.",
    columnKey: "focus",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    type: TaskType.SHIP,
    estimateMinutes: 150,
    storyPoints: 5,
    tags: ["planetscale", "infra"],
    projectSlug: "nextjs-ai-db-learning",
    docSlug: "planetscale-db-notes",
    dueDate: "2025-01-23T15:00:00.000Z",
  },
  {
    id: "task_learning_daily_reflect",
    title: "Record daily learning retro",
    descriptionMarkdown: "Capture what Prisma, RSC, and PlanetScale experiments taught today.",
    columnKey: "backlog",
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.LOW,
    type: TaskType.LEARNING,
    estimateMinutes: 45,
    storyPoints: 2,
    tags: ["learning", "retro"],
    projectSlug: "nextjs-ai-db-learning",
    docSlug: "prisma-orms-notes",
  },
  {
    id: "task_valon_mock_panel",
    title: "Run Valon mock panel",
    descriptionMarkdown: "45-min mock with focus on ops metrics, AI assist, and doc rituals.",
    columnKey: "review",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: TaskType.SHIP,
    estimateMinutes: 120,
    storyPoints: 4,
    tags: ["interview", "valon"],
    projectSlug: "valon-interview",
    docSlug: "valon-interview-tactical",
    dueDate: "2025-01-25T19:00:00.000Z",
  },
];

type ColumnSeed = { key: string; id: string; name: string; position: number };
type ProjectSeed = {
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  points: number;
  notionUrl: string;
};
type DocSeed = {
  slug: string;
  projectSlug: string;
  title: string;
  summary: string;
  notionUrl: string;
  contentMarkdown: string;
};
type TaskSeed = {
  id: string;
  title: string;
  descriptionMarkdown: string;
  columnKey: ColumnSeed["key"];
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  estimateMinutes?: number;
  storyPoints?: number;
  tags?: string[];
  projectSlug: string;
  docSlug?: string;
  dueDate?: string;
};

type ProjectMap = Record<string, string>;
type DocMap = Record<string, string>;

type SeedTaskContext = {
  boardId: string;
  columnIds: Record<string, string>;
  projectIds: ProjectMap;
  docIds: DocMap;
};

async function main() {
  const user = await seedPrimaryUser();
  await seedTenant(user.id);

  const projectIds = await seedProjects(user.id);
  const docIds = await seedDocs(projectIds);
  const columnIds = await seedBoard(user.id);
  await seedTasks({ boardId: BOARD_ID, columnIds, projectIds, docIds });

  console.info("✅ Seeded projects, docs, and tasks inspired by Notion Command Center.");
}

async function seedPrimaryUser() {
  const clerkUserId = process.env.SEED_CLERK_USER_ID || "user_ashwin";
  return prisma.user.upsert({
    where: { id: clerkUserId },
    update: {
      name: "Ashwin Rachha",
      email: "ashwin@example.com",
      energyProfile:
        "Deep work after lunch, reserve mornings for research + writing. Primary arenas: Neural Flow, Learning Stack, Interview loops.",
      goals: "Ship Neural Flow MVP, publish learning notes, keep interviews warm.",
    },
    create: {
      id: clerkUserId,
      name: "Ashwin Rachha",
      email: "ashwin@example.com",
      energyProfile:
        "Deep work after lunch, reserve mornings for research + writing. Primary arenas: Neural Flow, Learning Stack, Interview loops.",
      goals: "Ship Neural Flow MVP, publish learning notes, keep interviews warm.",
    },
  });
}

async function seedTenant(userId: string) {
  const tenantSlug = process.env.SEED_TENANT_SLUG || "ashwin";
  const tenantName = process.env.SEED_TENANT_NAME || "Ashwin Command Center";

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName },
    create: { slug: tenantSlug, name: tenantName, ownerId: userId },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: { tenantId: tenant.id, userId, role: "OWNER", status: "ACTIVE" },
  });
}

async function seedProjects(userId: string) {
  const projectIds: ProjectMap = {};

  for (const project of PROJECTS) {
    const record = await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        title: project.title,
        description: project.description,
        status: project.status,
        points: project.points,
        notionUrl: project.notionUrl,
      },
      create: {
        slug: project.slug,
        title: project.title,
        description: project.description,
        status: project.status,
        points: project.points,
        notionUrl: project.notionUrl,
        userId,
      },
    });

    projectIds[project.slug] = record.id;
  }

  return projectIds;
}

async function seedDocs(projectIds: ProjectMap) {
  const docIds: DocMap = {};

  for (const doc of DOCS) {
    const projectId = projectIds[doc.projectSlug];
    if (!projectId) throw new Error(`Missing project for doc ${doc.slug}`);

    const record = await prisma.doc.upsert({
      where: { slug: doc.slug },
      update: {
        title: doc.title,
        summary: doc.summary,
        notionUrl: doc.notionUrl,
        contentMarkdown: doc.contentMarkdown,
        projectId,
      },
      create: {
        slug: doc.slug,
        title: doc.title,
        summary: doc.summary,
        notionUrl: doc.notionUrl,
        contentMarkdown: doc.contentMarkdown,
        projectId,
      },
    });

    docIds[doc.slug] = record.id;
  }

  return docIds;
}

async function seedBoard(userId: string) {
  await prisma.board.upsert({
    where: { id: BOARD_ID },
    update: {
      title: "Command Center",
      description: "Neural Flow board that mirrors the Notion ritual.",
    },
    create: {
      id: BOARD_ID,
      userId,
      title: "Command Center",
      description: "Neural Flow board that mirrors the Notion ritual.",
    },
  });

  const columnIds: Record<string, string> = {};
  for (const column of COLUMN_DEFS) {
    const record = await prisma.column.upsert({
      where: { id: column.id },
      update: {
        name: column.name,
        position: column.position,
        boardId: BOARD_ID,
      },
      create: {
        id: column.id,
        name: column.name,
        position: column.position,
        boardId: BOARD_ID,
      },
    });

    columnIds[column.key] = record.id;
  }

  return columnIds;
}

async function seedTasks(context: SeedTaskContext) {
  for (const task of TASKS) {
    const projectId = context.projectIds[task.projectSlug];
    if (!projectId) throw new Error(`Missing project for task ${task.id}`);

    const columnId = context.columnIds[task.columnKey];
    if (!columnId) throw new Error(`Missing column ${task.columnKey} for task ${task.id}`);

    const docId = task.docSlug ? context.docIds[task.docSlug] : undefined;
    if (task.docSlug && !docId) {
      throw new Error(`Missing doc ${task.docSlug} for task ${task.id}`);
    }

    const baseData = {
      title: task.title,
      descriptionMarkdown: task.descriptionMarkdown,
      boardId: context.boardId,
      columnId,
      projectId,
      status: task.status,
      priority: task.priority,
      type: task.type,
      estimateMinutes: task.estimateMinutes,
      storyPoints: task.storyPoints,
      tags: task.tags ?? [],
      docId: docId ?? null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      source: "seed",
    };

    await prisma.task.upsert({
      where: { id: task.id },
      update: baseData,
      create: { id: task.id, ...baseData },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
