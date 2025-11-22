"use client";

import * as React from "react";
import Image from "next/image";
import { Flame, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Summary = {
  profile: { xp: number; level: number; currentDailyStreak: number; longestDailyStreak: number };
  progress: { slug: string; name: string; image: string; currentShards: number; targetShards: number }[];
  recent: { slug: string; name: string; earnedAt: string; image?: string | null }[];
};

export function GamificationWidget() {
  const [data, setData] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/gamify/summary", { cache: "no-store" });
        if (res.status === 401) {
          return; // not signed in, leave widget empty
        }
        if (!res.ok) {
          await res.text().catch(() => {});
          return;
        }
        const json = await res.json();
        if (active) setData(json);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const pct = Math.min(100, (data.profile.xp % 100) /* naive */);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Star className="size-4 text-yellow-500" />
            <span>Level {data.profile.level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-orange-500" />
            <span>{data.profile.currentDailyStreak} day streak</span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-muted">
          <div className="h-full bg-foreground" style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {data.progress.slice(0, 6).map((p) => {
            const progressPct = Math.round((p.currentShards / p.targetShards) * 100);
            return (
              <div key={p.slug} className="rounded-lg border p-2 text-center">
                <div className="mx-auto mb-1 h-8 w-8">
                  <Image src={p.image} alt={p.name} width={32} height={32} />
                </div>
                <p className="truncate text-xs font-medium">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.currentShards}/{p.targetShards} shards</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {data.recent.length > 0 ? (
          <div className="pt-1 text-xs text-muted-foreground">
            Recent: {data.recent.map((r) => r.name).join(", ")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
