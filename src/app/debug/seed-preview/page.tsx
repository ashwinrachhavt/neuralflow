import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText, ListChecks } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProjectWithTasks = Prisma.ProjectGetPayload<{
  include: {
    tasks: {
      orderBy: { updatedAt: "desc" };
      select: {
        id: true;
        title: true;
        status: true;
        storyPoints: true;
        type: true;
        updatedAt: true;
      };
    };
  };
}>;

type NoteForProject = Prisma.NoteGetPayload<{
  select: {
    id: true;
    title: true;
    contentMarkdown: true;
    updatedAt: true;
    task: {
      select: {
        projectId: true;
        type: true;
        title: true;
      };
    };
  };
}>;

type ProjectDoc = {
  id: string;
  title: string;
  summary: string;
  kind: string;
  updatedAt: Date;
  sourceTaskTitle?: string | null;
};

type ProjectPreview = ProjectWithTasks & { docs: ProjectDoc[] };

export const metadata: Metadata = {
  title: "Seed Preview",
  description: "Inspect demo Projects, Docs, and Tasks that the Prisma seed inserts.",
};

export default async function SeedPreviewPage() {
  const projects = await loadSeedPreview();

  return (
    <PageShell size="xl">
      <SectionHeader
        title="Seed Data Preview"
        description="Read-only view of the demo Projects, linked docs, and attached tasks."
        actions={
          <code className="rounded-md border bg-muted px-3 py-1 text-xs font-mono">
            npx prisma db seed
          </code>
        }
      />
      {!projects.length ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

async function loadSeedPreview(): Promise<ProjectPreview[]> {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tasks: {
        orderBy: [
          { status: "asc" },
          { updatedAt: "desc" },
        ],
        select: {
          id: true,
          title: true,
          status: true,
          storyPoints: true,
          type: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!projects.length) return [];

  const notes = await prisma.note.findMany({
    where: { task: { projectId: { not: null } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      contentMarkdown: true,
      updatedAt: true,
      task: {
        select: {
          projectId: true,
          type: true,
          title: true,
        },
      },
    },
  }) as NoteForProject[];

  const docsByProject = notes.reduce<Record<string, ProjectDoc[]>>((acc, note) => {
    const projectId = note.task?.projectId;
    if (!projectId) return acc;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push({
      id: note.id,
      title: note.title,
      summary: summarizeMarkdown(note.contentMarkdown),
      kind: note.task?.type ?? "NOTE",
      updatedAt: note.updatedAt,
      sourceTaskTitle: note.task?.title ?? null,
    });
    return acc;
  }, {});

  return projects.map((project) => ({
    ...project,
    docs: (docsByProject[project.id] ?? []).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    ),
  }));
}

function ProjectCard({ project }: { project: ProjectPreview }) {
  const status = deriveProjectStatus(project.tasks);
  const totalPoints = project.tasks.reduce(
    (sum, task) => sum + (task.storyPoints ?? 0),
    0,
  );
  const notionUrl = getProjectNotionUrl(project);

  return (
    <Card className="bg-card/70 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{project.title}</CardTitle>
            {project.description ? (
              <CardDescription>{project.description}</CardDescription>
            ) : null}
          </div>
          {notionUrl ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={notionUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                <span className="sr-only">Open Notion doc</span>
              </Link>
            </Button>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{status}</Badge>
          <Badge variant="outline">{totalPoints} pts</Badge>
          <Badge variant="outline">{project.tasks.length} tasks</Badge>
          <Badge variant="outline">{project.docs.length} docs</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <ProjectDocsList docs={project.docs} />
        <ProjectTasksList tasks={project.tasks} />
      </CardContent>
    </Card>
  );
}

function ProjectDocsList({ docs }: { docs: ProjectDoc[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <FileText className="size-4 text-muted-foreground" />
        Docs
      </div>
      {!docs.length ? (
        <p className="text-xs text-muted-foreground">No docs linked to this project.</p>
      ) : (
        <div className="space-y-2.5">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-lg border bg-muted/40 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.summary}</p>
                  {doc.sourceTaskTitle ? (
                    <p className="text-[11px] text-muted-foreground/80">
                      Source: {doc.sourceTaskTitle}
                    </p>
                  ) : null}
                </div>
                <Badge variant="outline">{formatKind(doc.kind)}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectTasksList({ tasks }: { tasks: ProjectWithTasks["tasks"] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <ListChecks className="size-4 text-muted-foreground" />
        Tasks
      </div>
      {!tasks.length ? (
        <p className="text-xs text-muted-foreground">No tasks mapped to this project yet.</p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatStatus(task.status)} · {task.storyPoints ?? "—"} pts
                  </p>
                </div>
                <Badge variant="outline">{formatStatus(task.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      <p className="mb-3 font-medium text-foreground">No seeded data found.</p>
      <p>
        Run <span className="rounded bg-background px-2 py-1 font-mono text-xs">npx prisma db seed</span> to load the demo Projects, Docs, and Tasks.
      </p>
    </div>
  );
}

function summarizeMarkdown(markdown?: string | null, max = 140) {
  if (!markdown) return "No summary provided.";
  const text = markdown.replace(/[#*_`>-]/g, "").replace(/\s+/g, " ").trim();
  if (!text) return "No summary provided.";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function deriveProjectStatus(tasks: ProjectWithTasks["tasks"]) {
  if (!tasks.length) return "No tasks";
  const done = tasks.filter((task) => task.status === "DONE").length;
  if (done === tasks.length) return "Completed";
  if (tasks.some((task) => task.status === "IN_PROGRESS")) return "In progress";
  return "Planned";
}

function formatStatus(status: Prisma.TaskStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "In progress";
    case "BACKLOG":
      return "Backlog";
    case "TODO":
      return "Todo";
    case "DONE":
      return "Done";
    case "ARCHIVED":
      return "Archived";
    default:
      return String(status as any).toLowerCase().replace(/_/g, " ");
  }
}

function formatKind(kind: string) {
  return kind
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function getProjectNotionUrl(project: ProjectWithTasks) {
  const direct = (project as ProjectWithTasks & { notionUrl?: string | null }).notionUrl;
  if (direct && direct.startsWith("http")) return direct;
  if (project.description) {
    const match = project.description.match(/https?:\/\/\S+/);
    if (match?.[0]) return match[0];
  }
  return null;
}
