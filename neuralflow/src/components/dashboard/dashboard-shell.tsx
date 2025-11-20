"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { RightRail } from "@/components/layout/right-rail";
import { BrainDump } from "@/components/brain-dump";
import { MiniCalendar } from "@/components/mini-calendar";
import { QuickFilters, type FilterState } from "@/components/quick-filters";
import { TodayMain } from "@/components/dashboard/today";

export function DashboardShell() {
  const [filters, setFilters] = React.useState<FilterState>({ type: "all", priority: "all" });
  return (
    <AppShell
      sidebar={<Sidebar />}
      rightRail={
        <RightRail>
          <BrainDump />
          <MiniCalendar />
          <QuickFilters value={filters} onChange={setFilters} />
        </RightRail>
      }
    >
      <TodayMain filters={filters} />
    </AppShell>
  );
}
