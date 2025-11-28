"use client";

import { SectionHeader } from "@/components/section-header";
import { useCard } from "@/hooks/api";

export function TaskPageHeader({ taskId }: { taskId: string }) {
  const { data, isLoading } = useCard(taskId);

  if (isLoading || !data) {
    return (
      <div className="mb-3 md:mb-4">
        <div className="h-7 w-56 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return <SectionHeader title={data.task.title} />;
}

