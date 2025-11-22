import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Optional: contextualized seed for Ashwin's Clerk profile + tenant
  await seedAshwinProfileAndTenant();

  const demoUserId = "user_demo";

  const user = await prisma.user.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      email: "demo@example.com",
      name: "Demo User",
    },
  });

  const board = await prisma.board.upsert({
    where: { id: "board_demo" },
    update: {},
    create: {
      id: "board_demo",
      title: "Dao Launch",
      description: "Milestones to ship the MVP",
      userId: user.id,
      columns: {
        create: [
          { id: "col_backlog", name: "Backlog", position: 0 },
          { id: "col_inprogress", name: "In Progress", position: 1 },
          { id: "col_done", name: "Done", position: 2 },
        ],
      },
    },
  });

  await prisma.task.upsert({
    where: { id: "task_spec" },
    update: {},
    create: {
      id: "task_spec",
      title: "Finalize technical spec",
      descriptionMarkdown: "- Review stack\n- Confirm data model",
      boardId: board.id,
      columnId: "col_inprogress",
    },
  });

  await prisma.note.upsert({
    where: { taskId: "task_spec" },
    update: {},
    create: {
      taskId: "task_spec",
      title: "Spec Notes",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Outstanding" }] },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Supabase migration" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "AI prompt tuning" }],
                  },
                ],
              },
            ],
          },
        ],
      }),
      contentMarkdown: "## Outstanding\n- Supabase migration\n- AI prompt tuning",
    },
  });

  // Seed data ready ✔

  // Additional Kanban/Todo demo content
  // Personal Kanban with standard columns and sample todos
  const personalBoard = await prisma.board.upsert({
    where: { id: "board_personal" },
    update: {},
    create: {
      id: "board_personal",
      title: "Personal Kanban",
      description: "Daily life and errands",
      userId: user.id,
      columns: {
        create: [
          { id: "col_p_backlog", name: "Backlog", position: 0 },
          { id: "col_p_todo", name: "Todo", position: 1 },
          { id: "col_p_doing", name: "In Progress", position: 2 },
          { id: "col_p_done", name: "Done", position: 3 },
        ],
      },
    },
  });

  const personalTasks = [
    {
      id: "task_groceries",
      title: "Buy groceries",
      descriptionMarkdown: "- Eggs\n- Milk\n- Bread",
      columnId: "col_p_todo",
    },
    {
      id: "task_laundry",
      title: "Do laundry",
      descriptionMarkdown: "Wash, dry, fold",
      columnId: "col_p_doing",
    },
    {
      id: "task_call_bank",
      title: "Call bank support",
      descriptionMarkdown: "Verify recent transaction",
      columnId: "col_p_backlog",
    },
    {
      id: "task_workout",
      title: "30-min workout",
      descriptionMarkdown: "Quick HIIT session",
      columnId: "col_p_done",
    },
  ];

  for (const t of personalTasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        title: t.title,
        descriptionMarkdown: t.descriptionMarkdown,
        boardId: personalBoard.id,
        columnId: t.columnId,
      },
    });
  }

  // Work Kanban board with sample tasks and one note
  const workBoard = await prisma.board.upsert({
    where: { id: "board_work" },
    update: {},
    create: {
      id: "board_work",
      title: "Work Kanban",
      description: "Team sprint tasks",
      userId: user.id,
      columns: {
        create: [
          { id: "col_w_backlog", name: "Backlog", position: 0 },
          { id: "col_w_selected", name: "Selected", position: 1 },
          { id: "col_w_inprogress", name: "In Progress", position: 2 },
          { id: "col_w_review", name: "Review", position: 3 },
          { id: "col_w_done", name: "Done", position: 4 },
        ],
      },
    },
  });

  await prisma.task.upsert({
    where: { id: "task_setup_ci" },
    update: {},
    create: {
      id: "task_setup_ci",
      title: "Set up CI pipeline",
      descriptionMarkdown: "Configure tests and lint in CI",
      boardId: workBoard.id,
      columnId: "col_w_selected",
      tags: ["devops"],
    },
  });

  await prisma.task.upsert({
    where: { id: "task_fix_bug_123" },
    update: {},
    create: {
      id: "task_fix_bug_123",
      title: "Fix bug #123",
      descriptionMarkdown: "Repro crash, add test, patch",
      boardId: workBoard.id,
      columnId: "col_w_inprogress",
      priority: "HIGH",
      tags: ["bug"],
    },
  });

  await prisma.task.upsert({
    where: { id: "task_write_docs" },
    update: {},
    create: {
      id: "task_write_docs",
      title: "Write user guide",
      descriptionMarkdown: "Draft quickstart and FAQ",
      boardId: workBoard.id,
      columnId: "col_w_review",
    },
  });

  await prisma.note.upsert({
    where: { taskId: "task_write_docs" },
    update: {},
    create: {
      taskId: "task_write_docs",
      title: "Docs Outline",
      contentMarkdown: "# User Guide\n- Getting Started\n- Boards and Tasks\n- Shortcuts",
      contentJson: JSON.stringify({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "User Guide" }] },
          {
            type: "bulletList",
            content: [
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Getting Started" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Boards and Tasks" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Shortcuts" }] }] },
            ],
          },
        ],
      }),
    },
  });
}

async function seedAshwinProfileAndTenant() {
  const clerkUserId = process.env.SEED_CLERK_USER_ID || "user_ashwin";
  const ashwinName = process.env.SEED_CLERK_NAME || "Ashwin Rachha";
  const ashwinEmail = process.env.SEED_CLERK_EMAIL || null;
  const ashwinImage = process.env.SEED_CLERK_IMAGE || null;

  // Upsert Ashwin's profile (maps 1:1 to Clerk userId)
  const ashwin = await prisma.user.upsert({
    where: { id: clerkUserId },
    update: {
      name: ashwinName,
      email: ashwinEmail,
      image: ashwinImage,
      energyProfile:
        "Deep work in the afternoon; use 50/10 focus blocks. Priorities: Neural Flow product, Learning (Next.js + AI + Databases), Infra (PlanetScale).",
      goals:
        "Ship Neural Flow MVP, write learning blogs, keep performance smooth (skeletons, prefetch).",
    },
    create: {
      id: clerkUserId,
      name: ashwinName,
      email: ashwinEmail,
      image: ashwinImage,
      energyProfile:
        "Deep work in the afternoon; use 50/10 focus blocks. Priorities: Neural Flow product, Learning (Next.js + AI + Databases), Infra (PlanetScale).",
      goals:
        "Ship Neural Flow MVP, write learning blogs, keep performance smooth (skeletons, prefetch).",
    },
  });

  // Upsert a personal tenant/workspace and membership
  const tenantSlug = process.env.SEED_TENANT_SLUG || "ashwin";
  const tenantName = process.env.SEED_TENANT_NAME || "Ashwin Rachha";

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {},
    create: { slug: tenantSlug, name: tenantName, ownerId: ashwin.id },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: ashwin.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: { tenantId: tenant.id, userId: ashwin.id, role: "OWNER", status: "ACTIVE" },
  });

  // Seed projects that mirror Command Center items
  await prisma.project.upsert({
    where: { id: "proj_neuralflow" },
    update: {},
    create: {
      id: "proj_neuralflow",
      userId: ashwin.id,
      title: "Neural Flow",
      description: "Focus-first productivity copilot."
    },
  });

  await prisma.project.upsert({
    where: { id: "proj_learning" },
    update: {},
    create: {
      id: "proj_learning",
      userId: ashwin.id,
      title: "Next.js + AI + Databases",
      description: "Learning notes and experiments (Prisma, PlanetScale).",
    },
  });

  await prisma.project.upsert({
    where: { id: "proj_valon" },
    update: {},
    create: {
      id: "proj_valon",
      userId: ashwin.id,
      title: "Valon Prep",
      description: "Interview notes and reusable templates.",
    },
  });

  // Create a focused board with a couple of tasks for Ashwin
  const board = await prisma.board.upsert({
    where: { id: "board_ashwin_nf" },
    update: {},
    create: {
      id: "board_ashwin_nf",
      userId: ashwin.id,
      title: "Neural Flow – Focus Board",
      description: "Single-task focus flow and perf polish",
      columns: {
        create: [
          { id: "col_nf_backlog", name: "Backlog", position: 0 },
          { id: "col_nf_focus", name: "Focus", position: 1 },
          { id: "col_nf_done", name: "Done", position: 2 },
        ],
      },
    },
  });

  await prisma.task.upsert({
    where: { id: "task_nf_focus_flow" },
    update: {},
    create: {
      id: "task_nf_focus_flow",
      boardId: board.id,
      columnId: "col_nf_focus",
      title: "Implement focus-first task flow",
      descriptionMarkdown:
        "Enforce single active task. Auto-collapse other UI. Add context panel.",
      projectId: "proj_neuralflow",
      priority: "HIGH",
      type: "DEEP_WORK",
      estimatedPomodoros: 4,
    },
  });

  await prisma.task.upsert({
    where: { id: "task_nf_skeletons" },
    update: {},
    create: {
      id: "task_nf_skeletons",
      boardId: board.id,
      columnId: "col_nf_backlog",
      title: "Add route-level skeletons & transitions",
      descriptionMarkdown:
        "(workspace)/loading.tsx + small content transition. Respect prefers-reduced-motion.",
      projectId: "proj_neuralflow",
      priority: "MEDIUM",
      type: "SHIP",
      estimatedPomodoros: 2,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
