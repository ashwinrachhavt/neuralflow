"use client";

import { Card } from "@/components/ui/card";
import Board from "@/components/kanban/Board";
import type { Task, TaskColumn } from "@/lib/types";

interface KanbanViewProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onTaskEdit: (task: Task) => void;
  onTaskAiClick: (taskId: string) => void;
  onAddTask: (columnId: TaskColumn) => void;
}

export function KanbanView({ 
  tasks, 
  onTasksChange, 
  onTaskEdit, 
  onTaskAiClick, 
  onAddTask 
}: KanbanViewProps) {
  const todoTasks = tasks.filter(t => t.column_id === 'todo').length;
  const doingTasks = tasks.filter(t => t.column_id === 'doing').length;
  const doneTasks = tasks.filter(t => t.column_id === 'done').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kanban Board</h1>
          <p className="text-muted-foreground">
            Organize and track your tasks visually
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
            <span>{todoTasks} To Do</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>{doingTasks} In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>{doneTasks} Done</span>
          </div>
        </div>
      </div>

      {/* Board */}
      <Card className="p-6">
        <Board
          tasks={tasks}
          onTasksChange={onTasksChange}
          onTaskEdit={onTaskEdit}
          onTaskAiClick={onTaskAiClick}
          onAddTask={onAddTask}
        />
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {tasks.reduce((sum, task) => sum + task.pom_count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Pomodoros</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
