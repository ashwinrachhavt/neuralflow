import { PrismaClient, TaskPriority, TaskStatus, TaskType, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "ashwinr@vt.edu";

    console.log(`Checking for user with email: ${email}...`);

    const user = await prisma.user.findFirst({
        where: { email },
    });

    if (!user) {
        console.error(`\n❌ User with email '${email}' not found in the local database.`);
        console.error("👉 Please log in to the application via Clerk first to create your user record.");
        console.error("   Then run this script again.\n");
        process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.id})`);

    // --- 0. Cleanup Old Boards ---
    // This ensures the new Master Board is the only one (and thus default)
    console.log("Cleaning up old boards...");
    await prisma.board.deleteMany({
        where: { userId: user.id },
    });

    // --- 1. Create Master Board ---
    console.log("Creating 'Master Kanban' Board...");
    const masterBoardId = `board_master_${user.id}`;
    const masterBoard = await prisma.board.create({
        data: {
            id: masterBoardId,
            title: "Master Kanban",
            description: "Unified view of all projects",
            userId: user.id,
            columns: {
                create: [
                    { id: `col_master_backlog_${user.id}`, name: "Backlog", position: 0 },
                    { id: `col_master_todo_${user.id}`, name: "To Do", position: 1 },
                    { id: `col_master_doing_${user.id}`, name: "In Progress", position: 2 },
                    { id: `col_master_done_${user.id}`, name: "Done", position: 3 },
                ],
            },
        },
        include: { columns: true },
    });

    // Helper to get column ID by name
    const getColId = (name: string) => {
        const id = masterBoard.columns.find(c => c.name === name)?.id;
        if (!id) throw new Error(`Column not found: ${name}`);
        return id;
    };

    // --- 2. Seed Projects ---

    // Neural Flow
    console.log("Seeding 'Neural Flow'...");
    const pNeural = await prisma.project.upsert({
        where: { slug: "neuralflow" },
        update: {},
        create: {
            slug: "neuralflow",
            userId: user.id,
            title: "Neural Flow",
            description: "Focus-first productivity copilot.",
            status: ProjectStatus.ACTIVE,
            points: 3,
            notionUrl: "https://www.notion.so/1322e26208a580f89e2ae33bf5813c07",
        },
    });

    // Docs for Neural Flow
    await prisma.doc.upsert({
        where: { slug: "doc-nf-vision" },
        update: {},
        create: {
            slug: "doc-nf-vision",
            projectId: pNeural.id,
            title: "Neural Flow Vision",
            summary: "High-level product vision for Neural Flow as a focused productivity copilot.",
            contentMarkdown: `
# Neural Flow Vision

Neural Flow is a productivity app that keeps you locked onto one task until completion.

- It behaves like a work copilot: gathers context, arranges your thoughts, and automates the boring glue work between tools.
- The aim: make you feel like Tony Stark at the desk — high leverage, minimal friction.
      `.trim(),
            notionUrl: "https://www.notion.so/1322e26208a580f89e2ae33bf5813c07",
        },
    });

    await prisma.doc.upsert({
        where: { slug: "doc-nf-perf" },
        update: {},
        create: {
            slug: "doc-nf-perf",
            projectId: pNeural.id,
            title: "Performance Plan for Neural Flow",
            summary: "Ideas to make navigation and interactions in Neural Flow feel fast and polished.",
            contentMarkdown: `
# Performance Plan

Plan covers page transitions, route-level skeletons, and perceived speed tricks like prefetch-on-hover.

- Emphasis on keeping the workspace layout persistent while animating only page content.
- Also includes bundle & hydration optimisations: dynamic imports for heavy drag-and-drop, lean client boundaries, and enabling partial prerendering.
      `.trim(),
            notionUrl: "https://www.notion.so/2ab2e26208a580a0b51ff8795b42a8d5",
        },
    });

    // Tasks for Neural Flow
    const tasksNeural = [
        {
            id: "task_nf_focus_flow",
            title: "Implement focus-first task flow",
            descriptionMarkdown: "Enforce single active task at a time in the UI. Auto-collapse everything else, show one “focus card” with context.",
            priority: TaskPriority.HIGH,
            type: TaskType.SHIP,
            status: TaskStatus.TODO,
            estimatedPomodoros: 3,
            columnId: getColId("To Do"),
        },
        {
            id: "task_nf_skeletons",
            title: "Add route-level skeletons & transitions",
            descriptionMarkdown: "Use (workspace)/loading.tsx for skeletons and a small transition wrapper around page content. Respect prefers-reduced-motion.",
            priority: TaskPriority.MEDIUM,
            type: TaskType.SHIP,
            status: TaskStatus.IN_PROGRESS,
            estimatedPomodoros: 2,
            columnId: getColId("In Progress"),
        },
        {
            id: "task_nf_prefetch",
            title: "Prefetch kanban & pomodoro routes on hover",
            descriptionMarkdown: "Use router.prefetch on navbar hover / focus for key routes to make navigation feel instant.",
            priority: TaskPriority.MEDIUM,
            type: TaskType.MAINTENANCE,
            status: TaskStatus.TODO,
            estimatedPomodoros: 1,
            columnId: getColId("To Do"),
        },
    ];

    for (const t of tasksNeural) {
        await prisma.task.upsert({
            where: { id: t.id },
            update: {
                boardId: masterBoard.id,
                columnId: t.columnId,
                status: t.status,
            },
            create: {
                id: t.id,
                title: t.title,
                descriptionMarkdown: t.descriptionMarkdown,
                boardId: masterBoard.id,
                columnId: t.columnId,
                projectId: pNeural.id,
                priority: t.priority,
                type: t.type,
                status: t.status,
                estimatedPomodoros: t.estimatedPomodoros,
            },
        });
    }


    // Learning Project
    console.log("Seeding 'Learning'...");
    const pLearning = await prisma.project.upsert({
        where: { slug: "nextjs-ai-db-learning" },
        update: {},
        create: {
            slug: "nextjs-ai-db-learning",
            userId: user.id,
            title: "Next.js + AI + Databases",
            description: "Learning notes and experiments.",
            status: ProjectStatus.ACTIVE,
            points: 2,
            notionUrl: "https://www.notion.so/403606fb352e44a28731655329a77108",
        },
    });

    // Docs for Learning
    await prisma.doc.upsert({
        where: { slug: "doc-prisma-notes" },
        update: {},
        create: {
            slug: "doc-prisma-notes",
            projectId: pLearning.id,
            title: "Prisma & ORMs – Learning Notes",
            summary: "Notes on Prisma, its schema DSL, migrations, and type-safe database access.",
            contentMarkdown: `
# Prisma Notes

Prisma is your type-safe ORM layer, giving you a declarative schema and generated client for database access.

- Pros: compile-time safety, migration tooling, and a powerful query builder.
- Trade-offs: potential overhead, complex queries sometimes needing raw SQL.
      `.trim(),
            notionUrl: "https://www.notion.so/403606fb352e44a28731655329a77108",
        },
    });

    await prisma.doc.upsert({
        where: { slug: "doc-planetscale" },
        update: {},
        create: {
            slug: "doc-planetscale",
            projectId: pLearning.id,
            title: "PlanetScale DB Notes",
            summary: "PlanetScale as a Vitess-backed, branchable MySQL-compatible DB.",
            contentMarkdown: `
# PlanetScale

PlanetScale is a MySQL-compatible serverless DB powered by Vitess.

- Key ideas: sharding handled for you, schema migrations via deploy requests, and branching for safe experimentation.
      `.trim(),
            notionUrl: "https://www.notion.so/0fac865e09784a6a996320ba21898d2b",
        },
    });

    // Tasks for Learning
    const tasksLearning = [
        {
            id: "task_learning_prisma_schema",
            title: "Tighten Prisma schema for Neural Flow core",
            descriptionMarkdown: "Align Prisma models with how Notion Command Center represents projects, docs, and tasks so seeding stays 1:1 with your mental model.",
            priority: TaskPriority.HIGH,
            type: TaskType.LEARNING,
            status: TaskStatus.TODO,
            estimatedPomodoros: 2,
            columnId: getColId("To Do"),
        },
        {
            id: "task_learning_pscale_branch",
            title: "Set up PlanetScale branch for staging",
            descriptionMarkdown: "Create a staging branch, run Prisma migrations safely, and connect the Next.js app via DATABASE_URL.",
            priority: TaskPriority.MEDIUM,
            type: TaskType.MAINTENANCE,
            status: TaskStatus.TODO,
            estimatedPomodoros: 1,
            columnId: getColId("To Do"),
        },
    ];

    for (const t of tasksLearning) {
        await prisma.task.upsert({
            where: { id: t.id },
            update: {
                boardId: masterBoard.id,
                columnId: t.columnId,
                status: t.status,
            },
            create: {
                id: t.id,
                title: t.title,
                descriptionMarkdown: t.descriptionMarkdown,
                boardId: masterBoard.id,
                columnId: t.columnId,
                projectId: pLearning.id,
                priority: t.priority,
                type: t.type,
                status: t.status,
                estimatedPomodoros: t.estimatedPomodoros,
            },
        });
    }


    // Valon Project
    console.log("Seeding 'Valon Prep'...");
    const pValon = await prisma.project.upsert({
        where: { slug: "valon-interview" },
        update: {},
        create: {
            slug: "valon-interview",
            userId: user.id,
            title: "Valon Prep",
            description: "Interview notes and reusable templates.",
            status: ProjectStatus.COMPLETED,
            points: 1,
            notionUrl: "https://www.notion.so/26e2e26208a580b5bc3aed8c232d40a6",
        },
    });

    // Tasks for Valon
    const tasksValon = [
        {
            id: "task_valon_template",
            title: "Summarize Valon interview experience into a reusable template",
            descriptionMarkdown: "Turn your existing Valon notes into a structured Q&A template seeded into Neural Flow for future interview prep flows.",
            priority: TaskPriority.LOW,
            type: TaskType.SHIP,
            status: TaskStatus.DONE,
            estimatedPomodoros: 1,
            columnId: getColId("Done"),
        },
    ];

    for (const t of tasksValon) {
        await prisma.task.upsert({
            where: { id: t.id },
            update: {
                boardId: masterBoard.id,
                columnId: t.columnId,
                status: t.status,
            },
            create: {
                id: t.id,
                title: t.title,
                descriptionMarkdown: t.descriptionMarkdown,
                boardId: masterBoard.id,
                columnId: t.columnId,
                projectId: pValon.id,
                priority: t.priority,
                type: t.type,
                status: t.status,
                estimatedPomodoros: t.estimatedPomodoros,
            },
        });
    }

    console.log("✅ Real data seeding complete (Unified Master Board)!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
