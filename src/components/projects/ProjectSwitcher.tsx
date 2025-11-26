"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FolderPlus, ListChecks, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Chip } from "@/components/chip";
import { useProjects } from "@/hooks/api";
import { TASK_TOPICS } from "@/lib/ai/taxonomy";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  taskId?: string;
  currentProject?: { id: string; title: string } | null;
  className?: string;
};

export function ProjectSwitcher({ taskId, currentProject, className }: Props) {
  const { data: projects, isLoading } = useProjects();
  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const label = useMemo(() => currentProject?.title ?? "No Project", [currentProject]);

  async function assignToTask(projectId: string | null) {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/project`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) throw new Error('Failed to assign project');
      toast.success(projectId ? 'Project updated' : 'Project cleared');
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['card', taskId] as any }),
        qc.invalidateQueries({ queryKey: ['me','overview'] as any }),
        qc.invalidateQueries({ queryKey: ['me','boards'] as any }),
      ]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update project');
    }
  }

  async function createProjectsFromTopics() {
    const topics = Array.from(selected);
    if (!topics.length) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics }),
      });
      if (!res.ok) throw new Error('Failed to create');
      const data = await res.json() as { created: { id: string; title: string }[] };
      setOpenCreate(false);
      setSelected(new Set());
      await qc.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Created ${data.created.length} project${data.created.length === 1 ? '' : 's'}`);
      if (taskId && data.created.length === 1) {
        await assignToTask(data.created[0].id);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create projects');
    }
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-1">
              <Tag className="size-4" />
              {label}
            </span>
            <span className="text-muted-foreground/40">/</span>
            <ChevronDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start">
          <DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <ListChecks className="size-4" /> Existing Projects
            </div>
          </DropdownMenuLabel>
          {isLoading ? (
            <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
          ) : (projects?.length ? (
            <>
              {projects!.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => assignToTask(p.id)}>
                  {p.title}
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => assignToTask(null)} variant="destructive">
            Clear project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenCreate(true)}>
            <FolderPlus className="size-4" /> Create new project…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Projects from Topics</DialogTitle>
            <DialogDescription>
              Select topics to create one project per topic.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-2">
            {TASK_TOPICS.map((t) => {
              const active = selected.has(t);
              return (
                <button
                  key={t}
                  className="focus:outline-none"
                  onClick={() => {
                    const next = new Set(selected);
                    if (next.has(t)) next.delete(t); else next.add(t);
                    setSelected(next);
                  }}
                >
                  <Chip variant="work" active={active}>{t}</Chip>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={createProjectsFromTopics} disabled={!selected.size}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

