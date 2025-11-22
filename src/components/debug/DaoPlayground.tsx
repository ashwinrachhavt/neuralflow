"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id?: string;
  title: string;
  descriptionMarkdown?: string;
  priority?: string;
  tags?: string[];
  kind?: 'DEEP' | 'SHALLOW';
  depthScore?: number;
};

import { useUser } from "@clerk/nextjs";

export function DaoPlayground() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("todo");

  // Todo Agent State
  const [dump, setDump] = useState("");
  const [todoTasks, setTodoTasks] = useState<Task[] | null>(null);
  const [todoLoading, setTodoLoading] = useState(false);

  // Enricher Agent State
  const [enrichTaskTitle, setEnrichTaskTitle] = useState("Implement caching");
  const [enrichTaskDesc, setEnrichTaskDesc] = useState("Use Redis for high speed data access");
  const [enrichedResult, setEnrichedResult] = useState<any>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // Gamify Agent State
  const [gamifyAction, setGamifyAction] = useState("TASK_COMPLETE");
  const [gamifyDetails, setGamifyDetails] = useState('{"taskId": "123", "difficulty": "HARD"}');
  const [gamifyResult, setGamifyResult] = useState<any>(null);
  const [gamifyLoading, setGamifyLoading] = useState(false);

  // Reporter Agent State
  const [reportStart, setReportStart] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reportEnd, setReportEnd] = useState(new Date().toISOString().split('T')[0]);
  const [reportResult, setReportResult] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const runTodoAgent = async () => {
    if (!dump.trim()) return toast.error("Please enter a brain dump");
    setTodoLoading(true);
    try {
      const res = await fetch("/api/ai/todo-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainDumpText: dump }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setTodoTasks(data.context?.generatedTasks || []);
      toast.success("Tasks generated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTodoLoading(false);
    }
  };

  const runEnricherAgent = async () => {
    setEnrichLoading(true);
    try {
      const res = await fetch("/api/ai/enricher-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: enrichTaskTitle, taskDescription: enrichTaskDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setEnrichedResult(data);
      toast.success("Task enriched!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnrichLoading(false);
    }
  };

  const runGamifyAgent = async () => {
    if (!user?.id) return toast.error("You must be logged in");
    setGamifyLoading(true);
    try {
      const payload: any = {
        userId: user.id,
        action: gamifyAction
      };

      if (gamifyAction === "TASK_COMPLETE") {
        payload.taskId = gamifyDetails;
      } else if (gamifyAction === "POMODORO_COMPLETE") {
        payload.sessionId = gamifyDetails;
      }

      const res = await fetch("/api/ai/gamify-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGamifyResult(data);
      toast.success("Gamification applied!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGamifyLoading(false);
    }
  };

  const runReporterAgent = async () => {
    if (!user?.id) return toast.error("You must be logged in");
    setReportLoading(true);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, startIso: reportStart, endIso: reportEnd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReportResult(data);
      toast.success("Report generated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Debug Console</h2>
          <p className="text-muted-foreground">Test and validate individual AI agents in isolation.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="todo">Todo Agent</TabsTrigger>
          <TabsTrigger value="enricher">Enricher</TabsTrigger>
          <TabsTrigger value="gamify">Gamify</TabsTrigger>
          <TabsTrigger value="reporter">Reporter</TabsTrigger>
        </TabsList>

        {/* TODO AGENT */}
        <TabsContent value="todo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todo Agent</CardTitle>
              <CardDescription>Converts brain dumps into structured tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brain Dump</label>
                <Textarea
                  value={dump}
                  onChange={(e) => setDump(e.target.value)}
                  placeholder="E.g., I need to study for 2 hours, buy groceries, and fix the login bug."
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={runTodoAgent} disabled={todoLoading}>
                {todoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Tasks
              </Button>

              {todoTasks && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Generated Tasks</h3>
                  {todoTasks.map((t, i) => (
                    <div key={i} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between font-medium">
                        <span>{t.title}</span>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">{t.priority}</span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">{t.descriptionMarkdown}</p>
                      {t.tags && (
                        <div className="flex gap-1 mt-2">
                          {t.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENRICHER AGENT */}
        <TabsContent value="enricher" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enricher Agent</CardTitle>
              <CardDescription>Adds metadata, subtasks, and rationale to tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title</label>
                  <Input value={enrichTaskTitle} onChange={(e) => setEnrichTaskTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={enrichTaskDesc} onChange={(e) => setEnrichTaskDesc(e.target.value)} />
                </div>
              </div>
              <Button onClick={runEnricherAgent} disabled={enrichLoading}>
                {enrichLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enrich Task
              </Button>

              {enrichedResult && (
                <div className="mt-4 rounded-md bg-muted p-4 overflow-auto max-h-[400px]">
                  <pre className="text-xs">{JSON.stringify(enrichedResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GAMIFY AGENT */}
        <TabsContent value="gamify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gamify Agent</CardTitle>
              <CardDescription>Awards XP, stones, and achievements based on actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Type</label>
                  <Input value={gamifyAction} onChange={(e) => setGamifyAction(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Supported: TASK_COMPLETE, POMODORO_COMPLETE</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resource ID (Task/Session)</label>
                  <Input
                    value={gamifyDetails}
                    onChange={(e) => setGamifyDetails(e.target.value)}
                    placeholder="Task ID or Session ID"
                  />
                </div>
              </div>
              <Button onClick={runGamifyAgent} disabled={gamifyLoading}>
                {gamifyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simulate Action
              </Button>

              {gamifyResult && (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="rounded-lg border bg-card p-4 text-center flex-1">
                      <div className="text-2xl font-bold text-primary">+{gamifyResult.context?.gamifyResult?.xpDelta ?? 0}</div>
                      <div className="text-xs text-muted-foreground">XP Gained</div>
                    </div>
                    <div className="rounded-lg border bg-card p-4 text-center flex-1">
                      <div className="text-2xl font-bold text-primary">{gamifyResult.context?.gamifyResult?.streakAfter ?? 0}</div>
                      <div className="text-xs text-muted-foreground">New Streak</div>
                    </div>
                  </div>

                  {gamifyResult.context?.gamifyResult?.flavorText && (
                    <div className="rounded-md bg-primary/10 p-4 text-sm italic text-primary border border-primary/20">
                      "{gamifyResult.context.gamifyResult.flavorText}"
                    </div>
                  )}

                  <div className="rounded-md bg-muted p-4 overflow-auto max-h-[300px]">
                    <pre className="text-xs">{JSON.stringify(gamifyResult.context?.gamifyResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTER AGENT */}
        <TabsContent value="reporter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporter Agent</CardTitle>
              <CardDescription>Generates weekly reports, SWOT analysis, and experiments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
                </div>
              </div>
              <Button onClick={runReporterAgent} disabled={reportLoading}>
                {reportLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </Button>

              {reportResult && (
                <div className="mt-6 space-y-6">
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-lg font-semibold">Summary</h3>
                    <p>{reportResult.reporterResult.summary}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-green-500/5 border-green-500/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Strengths</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {reportResult.reporterResult.swot.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-500/5 border-red-500/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">Weaknesses</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {reportResult.reporterResult.swot.weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Opportunities</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {reportResult.reporterResult.swot.opportunities.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-500/5 border-yellow-500/20">
                      <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-600">Threats</CardTitle></CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {reportResult.reporterResult.swot.threats.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Proposed Experiments</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      {reportResult.reporterResult.experiments.map((exp: any, i: number) => (
                        <Card key={i}>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm">{exp.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                            {exp.description}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
