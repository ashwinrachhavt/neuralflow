"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Today", icon: CalendarDays },
  { href: "/boards", label: "Board", icon: LayoutGrid },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border bg-card/70 p-3">
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-foreground text-background shadow" : "text-muted-foreground hover:bg-foreground/10",
              )}
            >
              <Icon className="size-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/plan"
        className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-foreground/50"
      >
        <Sparkles className="size-4" /> Flow Planner
      </Link>
    </div>
  );
}

