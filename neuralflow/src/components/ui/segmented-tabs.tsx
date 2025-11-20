"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type SegmentedItem = { href: string; label: string; active?: boolean };

export function SegmentedTabs({ items }: { items: SegmentedItem[] }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border/60 bg-background/80 text-sm shadow-sm">
      {items.map((it, i) => (
        <Link
          key={it.href}
          href={it.href}
          className={cn(
            "px-4 py-2 transition-colors",
            it.active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/10",
            i !== items.length - 1 && "border-r border-border/60",
          )}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

