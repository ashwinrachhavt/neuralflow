"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Sidebar } from "@/components/layout/sidebar";
import { RightRail } from "@/components/layout/right-rail";
import { MiniCalendar } from "@/components/mini-calendar";
import { QuickFilters, type FilterState } from "@/components/quick-filters";
import { SmartSuggestions } from "@/components/suggestions/SmartSuggestions";
import { TodayMain } from "@/components/dashboard/today";
import { NewReportCard } from "@/components/notifications/NewReportCard";

export function DashboardShell() {
  const [filters, setFilters] = React.useState<FilterState>({ type: "all", priority: "all", topic: 'all' });
  return (
    <AppShell
      sidebar={<Sidebar />}
      rightRail={
        <RightRail>
          <NewReportCard />
          <MiniCalendar />
          <QuickFilters value={filters} onChange={setFilters} />
          <SmartSuggestions />
        </RightRail>
      }
    >
      <TodayMain filters={filters} />
    </AppShell>
  );
}
