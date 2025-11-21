import { PomodoroCard } from "@/components/pomodoro-card";
import { PageShell } from "@/components/layout/page-shell";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";

export default function PomodoroPage() {
  return (
    <PageShell size="md">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
        <SegmentedTabs items={[{ href: '/todos', label: 'Tasks', active: false }, { href: '/pomodoro', label: 'Timer', active: true }]} />
        <div className="w-full rounded-2xl border border-border/60 bg-card/90 p-4 shadow-xl">
          <PomodoroCard />
        </div>
      </div>
    </PageShell>
  );
}
