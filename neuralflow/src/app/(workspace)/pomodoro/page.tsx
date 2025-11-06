import { PomodoroCard } from "@/components/pomodoro-card";

export default function PomodoroPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Pomodoro Timer</h1>
        <p className="text-muted-foreground">
          Stay deliberate about focus and recovery. Use the timer to run 25-minute sprints paired
          with short breaks, keeping momentum anchored to a single task at a time.
        </p>
      </div>
      <PomodoroCard />
    </div>
  );
}
