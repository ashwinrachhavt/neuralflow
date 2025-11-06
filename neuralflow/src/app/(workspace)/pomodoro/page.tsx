import { PomodoroCard } from "@/components/pomodoro-card";

export default function PomodoroPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Pomodoro Timer</h1>
        <p className="text-muted-foreground">
          Stay deliberate about focus and recovery. Use the timer to run 25-minute
          sprints paired with short breaks, and keep momentum with clear intent.
        </p>
      </div>
      <div className="flex justify-center md:justify-start">
        <PomodoroCard />
      </div>
    </div>
  );
}
