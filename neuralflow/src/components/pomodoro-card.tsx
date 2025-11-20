"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { cn } from "@/lib/utils";

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const modeConfig = {
  focus: {
    label: "Focus",
    accentClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    duration: FOCUS_DURATION,
  },
  break: {
    label: "Break",
    accentClass: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    duration: BREAK_DURATION,
  },
} as const;

type Mode = keyof typeof modeConfig;

type TimerState = {
  mode: Mode;
  secondsRemaining: number;
  isRunning: boolean;
  activeTaskId: string | null;
};

type ApiBoard = {
  board: {
    id: string;
    title: string;
    columnOrder: string[];
    columns: Record<string, { id: string; name: string; position: number; taskIds: string[] }>;
    tasks: Record<string, { id: string; title: string; descriptionMarkdown: string | null; columnId: string }>;
  };
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatLabel(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function PomodoroCard() {
  const { data } = useQuery<ApiBoard>({
    queryKey: ["board"],
    queryFn: async () => {
      const res = await fetch("/api/board");
      if (!res.ok) throw new Error("Failed to load board");
      return (await res.json()) as ApiBoard;
    },
    staleTime: 5_000,
  });

  const taskOptions = useMemo(() => {
    const board = data?.board;
    if (!board) return [] as { id: string; title: string; description?: string }[];
    const todoCol = Object.values(board.columns).find(c => c.name.toLowerCase() === "todo");
    const inProgressCol = Object.values(board.columns).find(c => c.name.toLowerCase().includes("progress"));
    const order: string[] = [
      ...(todoCol ? todoCol.taskIds : []),
      ...(inProgressCol ? inProgressCol.taskIds : []),
      ...board.columnOrder.flatMap(cid => board.columns[cid]?.taskIds ?? []),
    ];
    const seen = new Set<string>();
    const result: { id: string; title: string; description?: string }[] = [];
    for (const id of order) {
      if (seen.has(id)) continue;
      const t = board.tasks[id];
      if (!t) continue;
      seen.add(id);
      result.push({ id: t.id, title: t.title, description: t.descriptionMarkdown ?? undefined });
    }
    return result;
  }, [data]);

  const [state, setState] = useState<TimerState>({
    mode: "focus",
    secondsRemaining: FOCUS_DURATION,
    isRunning: false,
    activeTaskId: null,
  });
  const [clockDisplay, setClockDisplay] = useState("--:--:--");

  useEffect(() => {
    const updateClock = () => {
      setClockDisplay(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateClock();
    const intervalId = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!state.isRunning) return;

    const intervalId = window.setInterval(() => {
      setState((current) => {
        if (current.secondsRemaining > 1) {
          return { ...current, secondsRemaining: current.secondsRemaining - 1 };
        }

        const nextMode: Mode = current.mode === "focus" ? "break" : "focus";
        return {
          ...current,
          mode: nextMode,
          secondsRemaining: modeConfig[nextMode].duration,
          isRunning: true,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [state.isRunning, state.mode]);

  const activeMode = state.mode;
  const activeConfig = modeConfig[activeMode];
  const nextMode: Mode = activeMode === "focus" ? "break" : "focus";
  const progress = 1 - state.secondsRemaining / activeConfig.duration;

  const handleToggle = () => {
    setState((current) => ({ ...current, isRunning: !current.isRunning }));
  };

  const handleReset = () => {
    setState((current) => ({
      ...current,
      mode: "focus",
      secondsRemaining: FOCUS_DURATION,
      isRunning: false,
    }));
  };

  const handleSkip = () => {
    setState({
      mode: nextMode,
      secondsRemaining: modeConfig[nextMode].duration,
      isRunning: false,
      activeTaskId: state.activeTaskId,
    });
  };

  const handleStartMode = (mode: Mode) => {
    setState({
      mode,
      secondsRemaining: modeConfig[mode].duration,
      isRunning: true,
      activeTaskId: state.activeTaskId,
    });
  };

  useEffect(() => {
    if (state.activeTaskId || taskOptions.length === 0) return;
    setState(current => ({ ...current, activeTaskId: taskOptions[0]?.id ?? null }));
  }, [taskOptions.length]);

  const selectedTask =
    taskOptions.find((task) => task.id === state.activeTaskId) ?? null;

  const handleTaskChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTaskId = event.target.value;
    setState((current) => ({
      ...current,
      activeTaskId: nextTaskId,
      mode: "focus",
      secondsRemaining: FOCUS_DURATION,
      isRunning: false,
    }));
  };

  return (
    <CardContainer className="w-full max-w-sm">
      <CardBody className="backdrop-blur-md">
        <CardItem
          translateZ={60}
          className="text-sm font-medium text-muted-foreground"
        >
          {clockDisplay}
        </CardItem>
        <CardItem translateZ={80} className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current focus
          </label>
          <div className="mt-2 space-y-3">
            <select
              value={state.activeTaskId ?? ""}
              onChange={handleTaskChange}
              className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-primary"
            >
              {taskOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {selectedTask?.description ? (
              <p className="text-xs text-muted-foreground">
                {selectedTask.description}
              </p>
            ) : null}
          </div>
        </CardItem>
        <CardItem translateZ={80} className="mt-2 flex items-center gap-3">
  <h2 className="text-2xl font-semibold">Focus</h2>
          <Badge className={cn("font-medium", activeConfig.accentClass)}>
            {activeConfig.label}
          </Badge>
        </CardItem>
        <CardItem translateZ={120} className="mt-8 text-center">
          <div className="text-5xl font-semibold tabular-nums">
            {formatDuration(state.secondsRemaining)}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Next: {modeConfig[nextMode].label} • {formatLabel(modeConfig[nextMode].duration)}
          </p>
        </CardItem>
        <CardItem translateZ={80} className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-foreground/80 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
            />
          </div>
        </CardItem>
        <CardItem translateZ={80} className="mt-8 flex flex-wrap gap-2">
          <Button onClick={handleToggle} className="flex-1 min-w-[7rem]">
            {state.isRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="flex-1 min-w-[7rem]">
            Skip
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1 min-w-[7rem]">
            Reset
          </Button>
        </CardItem>
        <CardItem translateZ={60} className="mt-6 flex gap-2 text-sm">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => handleStartMode("focus")}
          >
            Focus sprint
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => handleStartMode("break")}
          >
            Break time
          </Button>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
import { useQuery } from "@tanstack/react-query";
