import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
      title: "NeuralFlow Launch",
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

  console.log("Seed data ready ✔");

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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
