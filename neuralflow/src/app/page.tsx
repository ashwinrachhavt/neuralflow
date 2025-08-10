"use client";

import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { storeClerkUserIdInClient } from "@/lib/supabase/auth-bridge";

import { TaskForm } from "@/components/ui/task-form";
import { Navbar } from "@/components/layout/Navbar";
import { DynamicBackground } from "@/components/effects/DynamicBackground";
import { TabNavigation } from "@/components/layout/TabNavigation";
import { FocusMode } from "@/components/focus/FocusMode";
import { KanbanView } from "@/components/kanban/KanbanView";
import type { Task, TaskColumn, TimerMode } from "@/lib/types";
import { getRepository } from "@/lib/repo/repository-factory";
import type LocalMainRepository from "@/lib/repo/local-repository";
import { requestSubtask, requestEstimate, requestSummary } from "@/lib/ai/client";
import { cacheManager, CACHE_KEYS } from "@/lib/cache/cache-manager";

type Tab = "focus" | "kanban";

export default function Home() {
  const { user, isLoaded } = useUser();
  const repoRef = useRef<LocalMainRepository | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("focus"); // Default to Focus Mode
  const [taskFormState, setTaskFormState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    columnId?: TaskColumn;
    editingTask?: Task;
  }>({ isOpen: false, mode: 'create' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadTasks = async () => {
      try {
        // Store Clerk user ID for Supabase operations
        if (isLoaded && user) {
          storeClerkUserIdInClient(user.id);
          console.log('🔗 Stored Clerk user ID for Supabase:', user.id);
        }

        // Try to get from cache first
        const cachedTasks = cacheManager.get<Task[]>(CACHE_KEYS.TASKS);
        if (cachedTasks) {
          setTasks(cachedTasks);
          setIsLoading(false);
          return;
        }

        // Load from repository
        const r = getRepository() as unknown as LocalMainRepository;
        repoRef.current = r;
        const taskData = await r.getTasks();
        setTasks(taskData);
        
        // Cache the tasks for 30 seconds
        cacheManager.set(CACHE_KEYS.TASKS, taskData, 30 * 1000);
      } catch {
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [isLoaded, user]);

  const updateTasks = async (next: Task[]) => {
    setTasks(next);
    // Update cache immediately
    cacheManager.set(CACHE_KEYS.TASKS, next, 30 * 1000);
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
    if (!repoRef.current) {
      console.error('❌ Repository not initialized');
      return;
    }
    
    console.log('🚀 Creating task:', { title, notes, mode: taskFormState.mode });
    
    try {
      if (taskFormState.mode === 'create' && taskFormState.columnId) {
        console.log('📝 Creating new task in column:', taskFormState.columnId);
        const created = await repoRef.current.tasks.create({ 
          title, 
          notes, 
          column_id: taskFormState.columnId 
        });
        console.log('✅ Task created successfully:', created);
        
        const newTasks = [...tasks, created];
        setTasks(newTasks);
        cacheManager.set(CACHE_KEYS.TASKS, newTasks, 30 * 1000);
        console.log('📊 Updated task list, total tasks:', newTasks.length);
      } else if (taskFormState.mode === 'edit' && taskFormState.editingTask) {
        console.log('✏️ Updating existing task:', taskFormState.editingTask.id);
        const updated = await repoRef.current.tasks.update(taskFormState.editingTask.id, { title, notes });
        console.log('✅ Task updated successfully:', updated);
        
        const newTasks = tasks.map((t) => (t.id === taskFormState.editingTask!.id ? updated : t));
        setTasks(newTasks);
        cacheManager.set(CACHE_KEYS.TASKS, newTasks, 30 * 1000);
      }
    } catch (error) {
      console.error('❌ Error handling task form submission:', error);
    }
    
    setTaskFormState({ isOpen: false, mode: 'create' });
  };

  const handleAiClick = async (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    const choice = window.prompt("AI: subtask / estimate / summary?", "subtask");
    if (!choice) return;
    
    // Check cache first for AI responses
    const cacheKey = CACHE_KEYS.AI_RESPONSE(taskId, choice);
    const cachedResponse = cacheManager.get(cacheKey);
    if (cachedResponse) {
      console.log('Using cached AI response:', cachedResponse);
      return;
    }
    
    // Use frontend-developer persona for UI tasks, ai-engineer for technical tasks
    const persona = t.title.toLowerCase().includes('ui') || t.title.toLowerCase().includes('design') ? 'frontend-developer' : 'ai-engineer';
    const common = { taskId, persona } as const;
    
    let response;
    if (choice.startsWith("sub")) response = await requestSubtask(t.title, t.notes, taskId, { ...common });
    else if (choice.startsWith("est")) response = await requestEstimate(t.title, t.notes, taskId, { ...common });
    else response = await requestSummary(t.title, t.notes, taskId, { ...common });
    
    // Cache the response for 10 minutes
    if (response) {
      cacheManager.set(cacheKey, response, 10 * 60 * 1000);
    }
  };

  const currentTask = tasks.find((t) => t.id === currentTaskId);

  if (isLoading) {
    return (
      <div className="min-h-svh">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh">
      <Navbar />
      
      <SignedOut>
        <DynamicBackground useUnicornStudio={true} />
        <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 z-10">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
              Neural Flow
            </h1>
            <p className="text-gray-300 mb-8 text-lg drop-shadow-md">
              Focus. Create. Accomplish.
            </p>
            <p className="text-gray-400 mb-8 drop-shadow-md">
              Your productivity companion with AI-powered task management and Pomodoro timer.
            </p>
            <SignInButton mode="modal">
              <button className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <main className="container mx-auto py-8 px-4">
          {/* Tab Navigation */}
          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          {/* Tab Content */}
          {activeTab === "focus" && (
            <FocusMode
              tasks={tasks}
              currentTask={currentTask}
              onTaskSelect={setCurrentTaskId}
              onTimerComplete={async (mode: TimerMode, taskId?: string) => {
                if (mode === 'FOCUS' && taskId && repoRef.current) {
                  const updated = await repoRef.current.tasks.incrementPomodoroCount(taskId);
                  const newTasks = tasks.map((t) => (t.id === taskId ? updated : t));
                  setTasks(newTasks);
                  cacheManager.set(CACHE_KEYS.TASKS, newTasks, 30 * 1000);
                }
              }}
            />
          )}

          {activeTab === "kanban" && (
            <KanbanView
              tasks={tasks}
              onTasksChange={updateTasks}
              onTaskEdit={handleEditTask}
              onTaskAiClick={handleAiClick}
              onAddTask={handleAddTask}
            />
          )}
        </main>
        
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
