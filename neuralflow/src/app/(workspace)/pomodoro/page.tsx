import { PomodoroCard } from "@/components/pomodoro-card";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";

export default function PomodoroPage() {
  return (
    <PageShell size="md">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeader
          title="Focus"
          description="Stay deliberate about focus and recovery. Use 25‑minute sprints paired with short breaks."
          className="items-center text-center"
        />
        <div className="mt-6 flex justify-center">
          <PomodoroCard />
        </div>
      </div>
    </PageShell>
  );
}
