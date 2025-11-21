"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { StoneCelebrateModal } from "@/components/gamification/StoneCelebrateModal";
import type { PublicImage } from "@/lib/server/list-public-images";
import { generateMilestones, unlockedCount } from "@/lib/gamification/progression";
import { getStonePoints } from "@/lib/gamification/config";

export function RewardSimulator({ images }: { images: PublicImage[] }) {
  const milestones = React.useMemo(() => generateMilestones(images.length || 12), [images.length]);
  const [points, setPoints] = React.useState(0);
  const [open, setOpen] = React.useState<null | { name: string; image?: string; rarity?: string }>(null);
  const prevUnlocked = React.useRef(0);
  const [stoneSlug, setStoneSlug] = React.useState<string | undefined>(images[0]?.slug);

  const currentUnlocked = unlockedCount(points, milestones);
  React.useEffect(() => {
    if (currentUnlocked > prevUnlocked.current) {
      const idx = currentUnlocked - 1;
      const im = images[idx];
      if (im) setOpen({ name: im.name, image: im.src });
      prevUnlocked.current = currentUnlocked;
    }
  }, [currentUnlocked, images]);

  const nextMilestone = milestones[currentUnlocked] ?? milestones[milestones.length - 1] + 10;
  const delta = Math.max(0, nextMilestone - points);

  function add(n: number) { setPoints((p) => Math.max(0, p + n)); }
  function reset() { setPoints(0); prevUnlocked.current = 0; }
  function addStonePoints() {
    if (!stoneSlug) return;
    add(getStonePoints(stoneSlug));
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Priority points</p>
          <p className="text-2xl font-semibold">{points}</p>
          <p className="text-xs text-muted-foreground">{currentUnlocked}/{images.length} jewels unlocked</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => add(1)}>+1 (LOW)</Button>
          <Button variant="outline" onClick={() => add(2)}>+2 (MED)</Button>
          <Button variant="outline" onClick={() => add(3)}>+3 (HIGH)</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground">Stone:</label>
        <select className="rounded border bg-background px-2 py-1 text-sm" value={stoneSlug} onChange={(e) => setStoneSlug(e.target.value)}>
          {images.map((im) => (
            <option key={im.slug} value={im.slug}>{im.name}</option>
          ))}
        </select>
        <Button size="sm" variant="outline" onClick={addStonePoints}>Add configured points (+{stoneSlug ? getStonePoints(stoneSlug) : 0})</Button>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted/50">
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.round(((points - (milestones[currentUnlocked - 1] ?? 0)) / (nextMilestone - (milestones[currentUnlocked - 1] ?? 0))) * 100))}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{delta} pts to next jewel</p>

      <StoneCelebrateModal open={!!open} onClose={() => setOpen(null)} stone={open} />
    </div>
  );
}
