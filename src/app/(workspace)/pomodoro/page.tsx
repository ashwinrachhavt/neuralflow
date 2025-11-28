import { PomodoroCard } from "@/components/pomodoro-card";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Focus",
  description: "Pomodoro timer for deep work",
};

export default function PomodoroPage() {
  return (
    <PageShell size="md">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <PomodoroCard />
      </div>
    </PageShell>
  );
}
