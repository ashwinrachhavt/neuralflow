"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { TaskForm } from "@/components/ui/task-form";
import Sidebar from "@/components/layout/Sidebar";
import Board from "@/components/kanban/Board";
import { Timer } from "@/components/pomodoro/Timer";
import type { Task, TaskColumn } from "@/lib/types";
import { getRepository } from "@/lib/repo/repository-factory";
import type LocalMainRepository from "@/lib/repo/local-repository";
import { requestSubtask, requestEstimate, requestSummary } from "@/lib/ai/client";

export default function Home() {
  const router = useRouter();
  const repoRef = useRef<LocalMainRepository | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  const [taskFormState, setTaskFormState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    columnId?: TaskColumn;
    editingTask?: Task;
  }>({ isOpen: false, mode: 'create' });

  const handleNavigation = (to: "home" | "stats" | "settings") => {
    if (to === "stats") router.push("/analytics");
    else if (to === "settings") router.push("/settings");
    // home stays on current page
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const r = getRepository() as unknown as LocalMainRepository;
      repoRef.current = r;
      r.getTasks().then(setTasks).catch(() => setTasks([]));
    } catch {
      // ignore in SSR
    }
  }, []);

  const updateTasks = async (next: Task[]) => {
    setTasks(next);
    try {
      await repoRef.current?.saveTasks(next);
    } catch {
      // ignore for now
    }
  };

  const handleAddTask = async (columnId: TaskColumn) => {
    setTaskFormState({ isOpen: true, mode: 'create', columnId });
  };

  const handleEditTask = async (task: Task) => {
    setTaskFormState({ isOpen: true, mode: 'edit', editingTask: task });
  };

  const handleTaskFormSubmit = async (title: string, notes?: string) => {
    if (!repoRef.current) return;
    
    if (taskFormState.mode === 'create' && taskFormState.columnId) {
      const created = await repoRef.current.tasks.create({ 
        title, 
        notes, 
        column_id: taskFormState.columnId 
      });
      setTasks((prev) => [...prev, created]);
    } else if (taskFormState.mode === 'edit' && taskFormState.editingTask) {
      const updated = await repoRef.current.tasks.update(taskFormState.editingTask.id, { title, notes });
      setTasks((prev) => prev.map((t) => (t.id === taskFormState.editingTask!.id ? updated : t)));
    }
    
    setTaskFormState({ isOpen: false, mode: 'create' });
  };

  const handleAiClick = async (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    const choice = window.prompt("AI: subtask / estimate / summary?", "subtask");
    if (!choice) return;
    // Use frontend-developer persona for UI tasks, ai-engineer for technical tasks
    const persona = t.title.toLowerCase().includes('ui') || t.title.toLowerCase().includes('design') ? 'frontend-developer' : 'ai-engineer';
    const common = { taskId, persona } as const;
    if (choice.startsWith("sub")) await requestSubtask(t.title, t.notes, taskId, { ...common });
    else if (choice.startsWith("est")) await requestEstimate(t.title, t.notes, taskId, { ...common });
    else await requestSummary(t.title, t.notes, taskId, { ...common });
  };

  const currentTask = tasks.find((t) => t.id === currentTaskId);

  return (
    <div className="min-h-svh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SignedOut>
        <div className="min-h-svh flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-8 h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
              Neural Flow
            </h1>
            <p className="text-slate-400 mb-8 text-lg">
              Focus. Create. Accomplish.
            </p>
            <p className="text-slate-500 mb-8">
              Your productivity companion with AI-powered task management and Pomodoro timer.
            </p>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="mx-auto flex max-w-[1400px] gap-6 px-4 sm:px-6">
          <Sidebar active="home" onNavigate={handleNavigation} />
          <main className="flex-1 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Neural Flow
              </h1>
              <p className="mt-2 text-slate-400">Focus. Create. Accomplish.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
                <Board
                  tasks={tasks}
                  onTasksChange={updateTasks}
                  onTaskEdit={handleEditTask}
                  onTaskAiClick={handleAiClick}
                  onAddTask={handleAddTask}
                />
              </Card>
              <div className="space-y-4">
                <Card className="border-slate-700/50 bg-slate-800/40 p-0 backdrop-blur-sm shadow-xl">
                  <Timer
                    currentTask={currentTask}
                    onComplete={async (mode, taskId) => {
                      if (mode === 'FOCUS' && taskId && repoRef.current) {
                        const updated = await repoRef.current.tasks.incrementPomodoroCount(taskId);
                        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
                      }
                    }}
                    compact
                    className="border-slate-700/50"
                  />
                </Card>
                <Card className="border-slate-700/50 bg-slate-800/40 p-4 backdrop-blur-sm shadow-xl">
                  <label className="block text-sm font-medium mb-3 text-slate-200">Active Task</label>
                  <select
                    className="w-full h-11 rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={currentTaskId || ''}
                    onChange={(e) => setCurrentTaskId(e.target.value || undefined)}
                  >
                    <option className="bg-slate-800 text-white" value="">Select a task...</option>
                    {tasks.map((t) => (
                      <option key={t.id} className="bg-slate-800 text-white" value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  {currentTask && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                      <p className="text-xs text-slate-300 uppercase tracking-wide font-medium">Current Focus</p>
                      <p className="text-sm font-medium text-white mt-1">{currentTask.title}</p>
                      <div className="flex items-center mt-2 text-xs text-slate-400">
                        <span className="inline-flex items-center">
                          🍅 {currentTask.pom_count} completed
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </main>
        </div>
        
        <TaskForm
          isOpen={taskFormState.isOpen}
          onClose={() => setTaskFormState({ isOpen: false, mode: 'create' })}
          onSubmit={handleTaskFormSubmit}
          initialTitle={taskFormState.editingTask?.title || ''}
          initialNotes={taskFormState.editingTask?.notes || ''}
          mode={taskFormState.mode}
        />
      </SignedIn>
    </div>
  );
}
