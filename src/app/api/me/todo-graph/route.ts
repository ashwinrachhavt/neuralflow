import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401 } from '@/lib/api-helpers';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const boards = await prisma.board.findMany({
    where: { userId },
    select: {
      id: true, title: true,
      columns: { select: { id: true, name: true } },
      tasks: {
        select: {
          id: true, title: true, status: true, priority: true, type: true,
          tags: true, topics: true, primaryTopic: true,
          columnId: true,
          project: { select: { id: true, title: true } },
          note: { select: { id: true, title: true } as any },
        },
      },
    },
  });

  const nodes: any[] = [];
  const edges: any[] = [];

  const addNode = (id: string, label: string, kind: string, props: any = {}) => {
    nodes.push({ id, label, kind, ...props });
  };
  const addEdge = (from: string, to: string, type: string, props: any = {}) => {
    edges.push({ from, to, type, ...props });
  };

  for (const b of boards) {
    addNode(`board:${b.id}`, b.title, 'board');
    for (const c of b.columns) addNode(`col:${c.id}`, c.name, 'column');
    for (const t of b.tasks) {
      addNode(`task:${t.id}`, t.title, 'task', { status: t.status, priority: t.priority, type: t.type });
      addEdge(`board:${b.id}`, `task:${t.id}`, 'contains');
      if (t.columnId) addEdge(`col:${t.columnId}`, `task:${t.id}`, 'in_column');
      if (t.project) {
        addNode(`proj:${t.project.id}`, t.project.title, 'project');
        addEdge(`proj:${t.project.id}`, `task:${t.id}`, 'in_project');
      }
      if (Array.isArray(t.tags)) {
        for (const tag of t.tags) { addNode(`tag:${tag}`, tag, 'tag'); addEdge(`task:${t.id}`, `tag:${tag}`, 'has_tag'); }
      }
      if (Array.isArray(t.topics)) {
        for (const topic of t.topics) { addNode(`topic:${topic}`, topic, 'topic'); addEdge(`task:${t.id}`, `topic:${topic}`, 'topic'); }
      }
      if ((t as any).note?.id) { addNode(`note:${(t as any).note.id}`, (t as any).note.title ?? 'Note', 'note'); addEdge(`task:${t.id}`, `note:${(t as any).note.id}`, 'has_note'); }
      // Learnings omitted unless model exists; consider separate API to join
    }
  }

  return NextResponse.json({ nodes, edges });
}
