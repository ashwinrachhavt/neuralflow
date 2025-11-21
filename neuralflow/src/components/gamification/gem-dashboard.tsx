"use client";

import * as React from "react";
import Image from "next/image";
import { Flame, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Claimables } from "@/components/gamification/claimables";
import { AllGems } from "@/components/gamification/all-gems";
import { Skeleton } from "@/components/ui/skeleton";

type GalleryResponse = {
  profile: {
    xp: number;
    level: number;
    currentDailyStreak: number;
    longestDailyStreak: number;
    totals: { gems: number };
  };
  catalog: { slug: string; name: string; rarity: string; theme: string; image: string; shards: { current: number; target: number }; earnedCount: number }[];
  earned: { slug: string; name: string; rarity: string; image?: string | null; earnedAt: string; lore?: string | null }[];
};

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / (max || 1)) * 100)));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GemDashboard() {
  const [data, setData] = React.useState<GalleryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [unauthorized, setUnauthorized] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setUnauthorized(false);
        const res = await fetch("/api/gamify/gallery", { cache: "no-store" });
        if (res.status === 401) {
          setUnauthorized(true);
          return;
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-36" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="space-y-6">
        <Claimables />
        <AllGems />
      </div>
    );
  }

  if (!data) return (
    <div className="space-y-6">
      <Claimables />
      <AllGems />
    </div>
  );

  const xpPct = Math.min(100, data.profile.xp % 100);

  return (
    <div className="space-y-6">
      <Claimables />
      <AllGems />

      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Level</CardTitle>
            <CardDescription>Your current progression</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Star className="size-4 text-yellow-500" /> Level {data.profile.level}</div>
            <ProgressBar value={xpPct} max={100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Streak</CardTitle>
            <CardDescription>Consistency pays off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex items-center gap-2"><Flame className="size-4 text-orange-500" /> {data.profile.currentDailyStreak} days</div>
            <div className="text-xs text-muted-foreground">Best: {data.profile.longestDailyStreak} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gems</CardTitle>
            <CardDescription>Hall of Fame</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-2xl font-semibold">{data.profile.totals.gems}</div>
            <div className="text-xs text-muted-foreground">Total gems earned</div>
          </CardContent>
        </Card>
      </div>

      {/* Catalog with progress */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Gem Catalog</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {data.catalog.map((g) => {
            return (
              <Card key={g.slug}>
                <CardContent className="p-3">
                  <div className="mx-auto mb-2 h-12 w-12">
                    <Image src={g.image} alt={g.name} width={48} height={48} />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium">{g.name}</div>
                    <div className="text-[10px] text-muted-foreground">{g.theme}</div>
                    <div className="mt-2 text-[10px]">{g.shards.current}/{g.shards.target} shards</div>
                    <div className="mt-1"><ProgressBar value={g.shards.current} max={g.shards.target} /></div>
                    <div className="mt-1 text-[10px] text-muted-foreground">Earned × {g.earnedCount}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent unlocks with lore */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Recent Unlocks</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.earned.length === 0 ? (
            <Card><CardContent className="p-4 text-sm text-muted-foreground">No gems yet — keep the flow going!</CardContent></Card>
          ) : (
            data.earned.slice(0, 8).map((e, i) => (
              <Card key={`${e.slug}-${i}`}>
                <CardContent className="flex gap-3 p-4">
                  <Image src={e.image || "/quartz.png"} alt={e.name} width={40} height={40} />
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(e.earnedAt).toLocaleString()}</div>
                    {e.lore ? <p className="mt-1 text-xs text-muted-foreground">{e.lore}</p> : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
