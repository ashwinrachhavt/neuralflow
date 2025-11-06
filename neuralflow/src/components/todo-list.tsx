"use client";

import { useMemo, useState } from "react";
import { Check, CirclePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Todo = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
};

const INITIAL_TODOS: Todo[] = [
  {
    id: "todo-1",
    title: "Draft weekly sprint outline",
    description: "Capture priorities and blockers for NeuralFlow team sync.",
    completed: false,
  },
  {
    id: "todo-2",
    title: "Review latest experiment results",
    description: "Summarise key insights from the conversation agent tests.",
    completed: true,
  },
  {
    id: "todo-3",
    title: "Prepare launch checklist",
    description: "Track QA, docs, and messaging for next release.",
    completed: false,
  },
];

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter(todo => todo.completed).length;
    return {
      total,
      done,
      remaining: total - done,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }, [todos]);

  const handleToggle = (id: string) => {
    setTodos(current =>
      current.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const handleAdd = () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) return;

    const nextTodo: Todo = {
      id: `todo-${crypto.randomUUID()}`,
      title: trimmed,
      description: draftDescription.trim() || undefined,
      completed: false,
    };

    setTodos(current => [nextTodo, ...current]);
    setDraftTitle("");
    setDraftDescription("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            Today&apos;s Focus
            <Badge variant="secondary" className="text-xs font-medium">
              {stats.done} / {stats.total} done
            </Badge>
          </CardTitle>
          <CardDescription>
            Use this list to capture the high-impact work you want to finish
            today. Drag tasks into Kanban once they grow bigger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed border-border/70 p-4">
            <label className="block text-sm font-medium text-muted-foreground">
              Quick add
            </label>
            <input
              value={draftTitle}
              onChange={event => setDraftTitle(event.target.value)}
              placeholder="Add a task headline"
              className="mt-2 w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-primary"
            />
            <textarea
              value={draftDescription}
              onChange={event => setDraftDescription(event.target.value)}
              placeholder="Optional details"
              className="mt-2 h-20 w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-primary"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={handleAdd} size="sm" className="gap-2">
                <CirclePlus className="size-4" /> Add Task
              </Button>
            </div>
          </div>

          <ul className="space-y-3">
            {todos.map(todo => (
              <li key={todo.id}>
                <button
                  type="button"
                  onClick={() => handleToggle(todo.id)}
                  className={cn(
                    "w-full rounded-xl border border-border/70 bg-background/70 p-4 text-left transition hover:border-primary/60",
                    todo.completed && "border-primary/70 bg-primary/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid size-5 place-items-center rounded-full border border-border/50",
                            todo.completed && "bg-primary text-primary-foreground",
                          )}
                        >
                          {todo.completed ? (
                            <Check className="size-3" />
                          ) : (
                            <span className="size-2 rounded-full bg-border" />
                          )}
                        </span>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            todo.completed && "line-through text-muted-foreground",
                          )}
                        >
                          {todo.title}
                        </p>
                      </div>
                      {todo.description ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {todo.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="text-[0.6rem] uppercase tracking-wide">
                      {todo.completed ? "Done" : "Active"}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Progress pulse</CardTitle>
          <CardDescription>
            A quick snapshot of how you&apos;re pacing today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="mt-2 text-3xl font-semibold">{stats.progress}%</p>
            <div className="mt-4 h-2 rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total tasks</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-medium text-emerald-500 dark:text-emerald-300">
                {stats.done}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium text-amber-500 dark:text-amber-300">
                {stats.remaining}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
