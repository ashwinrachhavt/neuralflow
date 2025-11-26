"use client";

import { Fragment, useEffect } from "react";
import { Dialog, DialogPanel, DialogBackdrop, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useCard } from "@/hooks/api";
import { CardTitleEditor } from "./CardTitleEditor";
import { CardAIDock } from "./CardAIDock";
import { Button } from "@/components/ui/button";
// import { CardDescriptionEditor } from "@/components/cards/CardDescriptionEditor";
import { CardTiptapEditor } from "./CardTiptapEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CardChat } from "./CardChat";
import { ProjectSwitcher } from "@/components/projects/ProjectSwitcher";

type Props = {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onOpenFull?: (id: string) => void;
  layoutIdBase?: string;
};

export function CardSheet({ taskId, open, onClose, onOpenFull, layoutIdBase = "" }: Props) {
  const { data, isLoading } = useCard(taskId);
  const qc = useQueryClient();
  // const [descExpanded, setDescExpanded] = useState(false);
  const applyMove = useMutation({
    mutationFn: async (columnId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/column`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ columnId }) });
      if (!res.ok) throw new Error('Move failed');
      return res.json();
    },
    onSuccess: async () => {
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ['board'] as any }),
        qc.invalidateQueries({ queryKey: ['card', taskId] as any }),
        qc.invalidateQueries({ queryKey: ['my-todos', 'TODO'] as any }),
      ]);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], select')) return;
      // if (e.key.toLowerCase() === 'e' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      //   e.preventDefault();
      //   setDescExpanded(v => !v);
      // }
      if (e.key.toLowerCase() === 'o' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        onOpenFull?.(taskId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenFull, taskId]);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4 scale-95" enterTo="opacity-100 translate-y-0 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 translate-y-0 scale-100" leaveTo="opacity-0 translate-y-4 scale-95">
              <DialogPanel as={motion.div}
                layoutId={`${layoutIdBase}card-${taskId}`}
                className="w-full max-w-5xl overflow-hidden rounded-xl border border-border/40 bg-background shadow-2xl"
                // @ts-expect-error - Framer motion types conflict with Headless UI
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="flex h-[85vh] flex-col bg-background shadow-xl">
                  {/* Header Actions */}
                  <div className="flex items-center justify-between border-b px-6 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ProjectSwitcher taskId={taskId} currentProject={data?.task.project ?? null} />
                      <span className="text-muted-foreground/40">/</span>
                      <span className="hover:text-foreground cursor-default transition-colors">{data?.task.column?.title ?? "No Status"}</span>
                      {data?.task.primaryTopic || (data?.task.topics && data.task.topics.length) ? (
                        <span className="ml-2 flex items-center gap-1">
                          {data?.task.primaryTopic ? (
                            <span className="rounded px-2 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{data.task.primaryTopic}</span>
                          ) : null}
                          {(data?.task.topics ?? []).filter(t => t !== data?.task.primaryTopic).slice(0, 1).map(t => (
                            <span key={t} className="rounded px-2 py-0.5 bg-muted text-foreground/80">{t}</span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={() => onOpenFull?.(taskId)} title="Open as page">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize-2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" x2="14" y1="3" y2="10" /><line x1="3" x2="10" y1="21" y2="14" /></svg>
                      </button>
                      <button className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" onClick={onClose} aria-label="Close">
                        <X className="size-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                    {/* Main Content (Left) */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="mx-auto max-w-3xl px-8 py-10">
                        {isLoading || !data ? (
                          <div className="space-y-8">
                            <div className="h-12 w-3/4 animate-pulse rounded bg-muted" />
                            <div className="space-y-4">
                              <div className="h-6 w-full animate-pulse rounded bg-muted/60" />
                              <div className="h-6 w-5/6 animate-pulse rounded bg-muted/60" />
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Title */}
                            <motion.div layoutId={`${layoutIdBase}card-title-${taskId}`} className="mb-8">
                              <CardTitleEditor taskId={taskId} initialTitle={data.task.title} className="w-full bg-transparent text-4xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                            </motion.div>

                            {/* Properties List (Vertical) */}
                            <div className="mb-10 space-y-1">
                              {/* Status */}
                              <div className="flex items-center py-1">
                                <div className="flex w-[140px] items-center gap-2 text-sm text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-dashed"><path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0" /><path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7" /><path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8" /><path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69" /><path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0" /><path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7" /><path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8" /><path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69" /></svg>
                                  <span>Status</span>
                                </div>
                                <div className="flex-1">
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm font-medium text-foreground">
                                    {data.task.column?.title ?? "No Status"}
                                  </span>
                                </div>
                              </div>

                              {/* Priority */}
                              <div className="flex items-center py-1">
                                <div className="flex w-[140px] items-center gap-2 text-sm text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-flag"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
                                  <span>Priority</span>
                                </div>
                                <div className="flex-1">
                                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${data.task.priority === 'HIGH' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                                    data.task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                                      'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {data.task.priority ?? "None"}
                                  </span>
                                </div>
                              </div>

                              {/* Due Date */}
                              <div className="flex items-center py-1">
                                <div className="flex w-[140px] items-center gap-2 text-sm text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                  <span>Due Date</span>
                                </div>
                                <div className="flex-1 text-sm text-foreground">
                                  {data.task.dueDate ? new Date(data.task.dueDate).toLocaleDateString() : <span className="text-muted-foreground/50">Empty</span>}
                                </div>
                              </div>

                              {/* Project */}
                              <div className="flex items-center py-1">
                                <div className="flex w-[140px] items-center gap-2 text-sm text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
                                  <span>Project</span>
                                </div>
                                <div className="flex-1 text-sm text-foreground hover:underline cursor-pointer">
                                  {data.task.project?.title ?? <span className="text-muted-foreground/50">Empty</span>}
                                </div>
                              </div>

                              {/* Add Property Placeholder */}
                              <div className="flex items-center py-1 opacity-0 hover:opacity-100 transition-opacity">
                                <div className="flex w-[140px] items-center gap-2 text-sm text-muted-foreground">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                  <span>Add property</span>
                                </div>
                              </div>
                            </div>

                            <div className="h-px w-full bg-border/40 mb-10" />

                            {/* AI Suggestion Banner (Inline) */}
                            {data.task.aiSuggestedColumnId && data.task.column && data.task.aiSuggestedColumnId !== data.task.column.id ? (
                              <div className="mb-8 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300">
                                    <Sparkles className="size-4" />
                                    <span>AI suggests moving this to <strong>{data.task.suggestedColumn?.title}</strong> based on recent activity.</span>
                                  </div>
                                  <Button size="sm" variant="outline" className="h-7 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300" onClick={() => applyMove.mutate(data.task.aiSuggestedColumnId!)}>
                                    Accept
                                  </Button>
                                </div>
                              </div>
                            ) : null}

                            {/* Editor */}
                            <div className="min-h-[300px] pb-12">
                              <CardTiptapEditor taskId={taskId} initialContent={data.task.descriptionMarkdown ?? ''} noteId={data.note?.id ?? null} className="prose-lg dark:prose-invert max-w-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0" />
                            </div>

                            <div className="h-px w-full bg-border/40 mb-8" />

                            {/* Assistant Chat */}
                            <div className="space-y-4 pb-8">
                              <h3 className="text-sm font-semibold text-foreground">Assistant</h3>
                              <CardChat
                                taskId={taskId}
                                cardContext={{
                                  title: data.task.title,
                                  descriptionMarkdown: data.task.descriptionMarkdown,
                                  primaryTopic: (data.task as any).primaryTopic ?? null,
                                  topics: (data.task as any).topics ?? [],
                                  projectTitle: data.task.project?.title ?? null,
                                  columnTitle: data.task.column?.title ?? null,
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="w-[320px] border-l border-border/40 bg-muted/5 p-6 hidden lg:block overflow-y-auto">
                      {/* AI Dock */}
                      <div className="pt-2">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h3>
                        <CardAIDock taskId={taskId} />
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

}
