import { KanbanBoard } from "@/components/kanban-board";
import { PomodoroCard } from "@/components/pomodoro-card";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            NeuralFlow
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Keep the creative flow going with a simple Pomodoro timer. Tweak this
            page to add more tools, dashboards, or integrations for your
            workflow.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-10 lg:max-w-xl">
          <PomodoroCard />
          <KanbanBoard />
        </div>
      </section>
    </main>
  );
}
