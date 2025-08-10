"use client";

import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { DynamicBackground } from "@/components/effects/DynamicBackground";
import { getRepository } from "@/lib/repo/repository-factory";
import type LocalMainRepository from "@/lib/repo/local-repository";
import type { Task } from "@/lib/types";
import { BarChart2, TrendingUp, Clock, Target, CheckCircle } from "lucide-react";

export default function AnalyticsPage() {
  const repoRef = useRef<LocalMainRepository | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const r = getRepository() as unknown as LocalMainRepository;
      repoRef.current = r;
      r.getTasks().then((data) => {
        setTasks(data);
        setLoading(false);
      }).catch(() => {
        setTasks([]);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
  }, []);

  // Calculate analytics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.column_id === 'done').length;
  const inProgressTasks = tasks.filter(t => t.column_id === 'doing').length;
  const todoTasks = tasks.filter(t => t.column_id === 'todo').length;
  const totalPomodoros = tasks.reduce((sum, task) => sum + task.pom_count, 0);
  const avgPomodorosPerTask = totalTasks > 0 ? (totalPomodoros / totalTasks).toFixed(1) : '0';
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

  // Get recent activity (last 7 days of completed tasks)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCompletions = tasks.filter(task => {
    if (task.column_id !== 'done') return false;
    const createdAt = new Date(task.created_at);
    return createdAt >= sevenDaysAgo;
  });

  if (loading) {
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
              Sign in to view your analytics
            </p>
            <SignInButton mode="modal">
              <button className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <main className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Analytics
            </h1>
            <p className="mt-2 text-muted-foreground">Track your productivity and progress</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Target className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-white">{totalTasks}</div>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-300">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-white">{completedTasks}</div>
                <p className="text-xs text-slate-400 mt-1">{completionRate}% completion rate</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-300">Total Pomodoros</CardTitle>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-white">{totalPomodoros}</div>
                <p className="text-xs text-slate-400 mt-1">~{(totalPomodoros * 25 / 60).toFixed(1)} hours focused</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-300">Avg per Task</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-white">{avgPomodorosPerTask}</div>
                <p className="text-xs text-slate-400 mt-1">pomodoros per task</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Breakdown */}
            <Card className="border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart2 className="h-5 w-5 text-blue-400" />
                  Task Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">To Do</span>
                    <span className="text-sm font-medium text-white">{todoTasks}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-slate-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: totalTasks > 0 ? `${(todoTasks / totalTasks) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">In Progress</span>
                    <span className="text-sm font-medium text-white">{inProgressTasks}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: totalTasks > 0 ? `${(inProgressTasks / totalTasks) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Done</span>
                    <span className="text-sm font-medium text-white">{completedTasks}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Completed this week</span>
                    <span className="font-medium text-white">{recentCompletions.length} tasks</span>
                  </div>
                  
                  {recentCompletions.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {recentCompletions.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-slate-700/30">
                          <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{task.title}</p>
                            <p className="text-xs text-slate-400">
                              {task.pom_count} pomodoros • {new Date(task.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks completed this week</p>
                      <p className="text-xs mt-1">Complete some tasks to see activity here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Productivity Insights */}
          {totalTasks > 0 && (
            <Card className="mt-6 border-slate-700/50 bg-slate-800/40 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-white">Productivity Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="text-slate-300 mb-1">Focus Time</div>
                    <div className="text-xl font-semibold text-white mb-1">
                      {(totalPomodoros * 25 / 60).toFixed(1)} hrs
                    </div>
                    <div className="text-xs text-slate-400">
                      Based on {totalPomodoros} pomodoros
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="text-slate-300 mb-1">Task Efficiency</div>
                    <div className="text-xl font-semibold text-white mb-1">
                      {avgPomodorosPerTask}
                    </div>
                    <div className="text-xs text-slate-400">
                      Average pomodoros per task
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30">
                    <div className="text-slate-300 mb-1">Completion Rate</div>
                    <div className="text-xl font-semibold text-white mb-1">
                      {completionRate}%
                    </div>
                    <div className="text-xs text-slate-400">
                      {completedTasks} of {totalTasks} tasks completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </SignedIn>
    </div>
  );
}
