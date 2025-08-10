"use client";

import { Card } from "@/components/ui/card";
import { Timer } from "@/components/pomodoro/Timer";
import type { Task, TimerMode } from "@/lib/types";

interface FocusModeProps {
  tasks: Task[];
  currentTask?: Task;
  onTaskSelect: (taskId: string | undefined) => void;
  onTimerComplete: (mode: TimerMode, taskId?: string) => void;
}

export function FocusMode({ tasks, currentTask, onTaskSelect, onTimerComplete }: FocusModeProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Focus Mode</h1>
        <p className="text-muted-foreground">
          Deep work sessions with the Pomodoro Technique
        </p>
      </div>

      {/* Task Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <label className="text-lg font-medium">Active Focus Task</label>
          <select
            className="w-full h-12 rounded-lg border border-input bg-background px-4 text-base focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
            value={currentTask?.id || ''}
            onChange={(e) => onTaskSelect(e.target.value || undefined)}
          >
            <option value="">Select a task to focus on...</option>
            {tasks
              .filter(t => t.column_id !== 'done') // Only show non-completed tasks
              .map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
          </select>
          
          {currentTask && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentTask.title}</h3>
                  {currentTask.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{currentTask.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">🍅 {currentTask.pom_count}</div>
                  <div className="text-xs text-muted-foreground">completed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Timer */}
      <Card className="p-8">
        <Timer
          currentTask={currentTask}
          onComplete={onTimerComplete}
          compact={false}
          className="border-0 shadow-none bg-transparent"
        />
      </Card>

      {/* Focus Tips */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Focus Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Work for 25 minutes with complete focus</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Take a 5-minute break after each session</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Take a longer 15-30 minute break every 4 sessions</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p>Eliminate distractions during focus time</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Progress */}
      {tasks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Today&apos;s Progress</h3>
          <div className="space-y-3">
            {tasks
              .filter(t => t.pom_count > 0)
              .sort((a, b) => b.pom_count - a.pom_count)
              .slice(0, 5)
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{task.column_id.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">🍅 {task.pom_count}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(task.pom_count * 25 / 60 * 10) / 10}h focused
                    </div>
                  </div>
                </div>
              ))}
            
            {tasks.filter(t => t.pom_count > 0).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">🍅</div>
                <p>No focus sessions completed yet</p>
                <p className="text-sm">Start your first Pomodoro session above!</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
