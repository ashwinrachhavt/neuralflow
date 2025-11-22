"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  sidebar: React.ReactNode;
  rightRail?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ sidebar, rightRail, children, className }: Props) {
  return (
    <div
      className={cn(
        "grid min-h-[calc(100vh-64px)] grid-cols-1 gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_320px]",
        className,
      )}
    >
      <aside className="hidden md:block">
        {sidebar}
      </aside>
      <section className="min-w-0">{children}</section>
      <aside className="hidden lg:block">
        {rightRail}
      </aside>
    </div>
  );
}

