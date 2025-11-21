"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ActivityEntry = {
  id: string;
  name: string;
  slug: string;
  rarity: string;
  points: number;
  timestamp: number;
};

type StoneSwitcherStone = {
  slug: string;
  name: string;
  theme: string;
  rarity: string;
  image: string | null;
};

export default function GamifyTestPage() {
  const [stones, setStones] = React.useState<StoneSwitcherStone[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [converting, setConverting] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityEntry[]>([]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/gamify/stones/public", { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        const list: StoneSwitcherStone[] = Array.isArray(data.stones) ? data.stones : [];
        setStones(list);
        if (list.length) {
          setSelected((prev) => prev ?? (list[0]?.slug ?? null));
        }
      } catch (error) {
        console.error("Failed to load stones", error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleConvert = React.useCallback(
    async (slug: string) => {
      if (converting) return;
      const stone = stones.find((s) => s.slug === slug);
      if (!stone) return;
      setConverting(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setActivity((prev) => {
          const entry: ActivityEntry = {
            id: `${slug}-${Date.now()}`,
            slug,
            name: stone.name,
            rarity: stone.rarity,
            points: 180 + Math.floor(Math.random() * 240),
            timestamp: Date.now(),
          };
          return [entry, ...prev].slice(0, 5);
        });
      } finally {
        setConverting(false);
      }
    },
    [converting, stones]
  );

  const mintedTotal = activity.reduce((sum, entry) => sum + entry.points, 0);
  const selectedIndex = selected ? stones.findIndex((s) => s.slug === selected) : -1;
  const selectedStone = selectedIndex >= 0 ? stones[selectedIndex] : stones[0];
  const streamProgress = stones.length
    ? (((selectedIndex >= 0 ? selectedIndex : 0) + 1) / stones.length) * 100
    : 0;

  const showSkeleton = loading && !stones.length;

  return (
    <PageShell size="lg">
      <div className="space-y-7">
        <SectionHeader
          title="Street stone switcher"
          description="Glide through the stones captured in public, lock onto one, and alchemize it into a reward with hypnotic transitions."
        />

        {showSkeleton ? (
          <LoadingSkeleton />
        ) : (
          <>
            <StoneSwitcher
              stones={stones}
              selectedSlug={selected}
              onSelect={setSelected}
              onConvert={handleConvert}
              converting={converting}
            />

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Flow capture stats</CardTitle>
                  <CardDescription>Track how the public stream is fueling your next focus reward.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 dark:bg-muted/5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Beam progress</p>
                        <p className="text-3xl font-semibold tracking-tight">{Math.round(streamProgress)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Current target</p>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedStone ? selectedStone.name : "No target"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Progress value={streamProgress} className="h-3" />
                    </div>
                  </div>

                  <div className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
                    <StatPill
                      icon={<Sparkles className="size-5" />}
                      label="Rewards minted"
                      value={`+${mintedTotal.toLocaleString()} xp`}
                      detail="Stone energy reinvested today"
                    />
                    <StatPill
                      icon={<Zap className="size-5" />}
                      label="Active conversions"
                      value={`${activity.length || 0}/5`}
                      detail="Most recent reward runs"
                    />
                    <StatPill
                      icon={<Sparkles className="size-5" />}
                      label="Rarity focus"
                      value={selectedStone ? selectedStone.rarity : "–"}
                      detail={selectedStone ? selectedStone.theme : "Select a stone to lock the beam"}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent conversions</CardTitle>
                  <CardDescription>Your last five stone-to-reward switches.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Convert a stone to see the activity feed pulse to life.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {activity.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-card/80 px-3 py-2.5">
                          <div>
                            <p className="text-sm font-semibold leading-tight">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.rarity.toLowerCase()} • {formatRelative(entry.timestamp)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-primary">+{entry.points} xp</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}

const rarityTokens = {
  COMMON: {
    surface: "#0f172a",
    glow: "#31426f",
    shadow: "#050510",
    ring: "rgba(157, 173, 255, 0.35)",
    accent: "#9fb2ff",
  },
  RARE: {
    surface: "#042f2e",
    glow: "#1ab9c4",
    shadow: "#031112",
    ring: "rgba(61, 213, 255, 0.4)",
    accent: "#93f5e8",
  },
  EPIC: {
    surface: "#11143c",
    glow: "#5c45ff",
    shadow: "#070718",
    ring: "rgba(153, 128, 255, 0.45)",
    accent: "#cdbdff",
  },
  LEGENDARY: {
    surface: "#2a103f",
    glow: "#f3b05c",
    shadow: "#120414",
    ring: "rgba(245, 178, 84, 0.55)",
    accent: "#ffe9c2",
  },
  DEFAULT: {
    surface: "#111827",
    glow: "#334155",
    shadow: "#04050b",
    ring: "rgba(148, 163, 184, 0.38)",
    accent: "#cbd5f5",
  },
} as const;

const pipelineSteps = [
  {
    label: "Street capture",
    description: "Ambient lenses flag a gemstone hiding in public.",
    icon: Camera,
  },
  {
    label: "Purify & score",
    description: "Flow Engine evaluates rarity, shine, and focus energy.",
    icon: Sparkles,
  },
  {
    label: "Reward minted",
    description: "Shard liquefies into a micro reward for your ritual.",
    icon: Zap,
  },
] as const;

type StoneSwitcherProps = {
  stones: StoneSwitcherStone[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  onConvert?: (slug: string) => void | Promise<void>;
  converting?: boolean;
};

function StoneSwitcher({ stones, selectedSlug, onSelect, onConvert, converting }: StoneSwitcherProps) {
  React.useEffect(() => {
    if (!stones.length || selectedSlug) return;
    onSelect(stones[0].slug);
  }, [stones, selectedSlug, onSelect]);

  if (!stones.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-card/70 p-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          The public scanners haven’t spotted any stones yet. As soon as one arrives, you can convert it here.
        </p>
      </div>
    );
  }

  const selectedIndex = selectedSlug ? stones.findIndex((s) => s.slug === selectedSlug) : 0;
  const safeIndex = selectedIndex === -1 ? 0 : selectedIndex;
  const selected = stones[safeIndex];

  const rarityKey = (selected?.rarity?.toUpperCase() ?? "DEFAULT") as keyof typeof rarityTokens;
  const palette = rarityTokens[rarityKey] ?? rarityTokens.DEFAULT;
  const gradient = `linear-gradient(135deg, ${palette.surface} 0%, ${palette.glow} 60%, ${palette.shadow} 100%)`;
  const activeStep = safeIndex % pipelineSteps.length;

  function handleShift(direction: number) {
    if (!stones.length) return;
    const nextIndex = (safeIndex + direction + stones.length) % stones.length;
    onSelect(stones[nextIndex].slug);
  }

  return (
    <div className="space-y-6">
      <motion.div
        layout
        className="relative overflow-hidden rounded-3xl border border-white/10 text-white shadow-[0_30px_120px_rgba(4,6,27,0.55)] dark:border-white/10"
        style={{ background: gradient }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
          style={{ backgroundImage: "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.15), transparent 35%)" }}
        />
        <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">{selected.theme}</p>
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{selected.name}</h2>
              <p className="text-sm text-white/75 sm:text-base">
                Every stone we capture in the wild can be refined into a micro reward. Switch through the stream, lock onto one, and let the Flow Engine mint your next hit of motivation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide">
              <span className="rounded-full border border-white/30 px-4 py-1.5 text-white">
                {selected.rarity.toLowerCase()}
              </span>
              <span className="rounded-full border border-white/20 px-4 py-1.5 text-white/80">
                {stones.length} public stones live
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.5em] text-white/70">
                <span className="h-px flex-1 bg-white/30" aria-hidden />
                conversion pipeline
                <span className="h-px flex-1 bg-white/30" aria-hidden />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {pipelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isReached = idx <= activeStep;
                  return (
                    <motion.div
                      key={step.label}
                      layout
                      className={cn(
                        "rounded-2xl border p-3 text-xs leading-relaxed",
                        isReached
                          ? "border-white/70 bg-white/10 text-white shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                          : "border-white/5 bg-white/5 text-white/70"
                      )}
                    >
                      <Icon className={cn("mb-2 size-4", isReached ? "text-white" : "text-white/60")} />
                      <div className="font-semibold tracking-wide">{step.label}</div>
                      <p>{step.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full px-6"
                onClick={() => (selected ? onConvert?.(selected.slug) : undefined)}
                disabled={converting || !selected}
              >
                {converting ? "Minting…" : "Convert to reward"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-white/20 bg-white/10 px-4 text-white hover:bg-white/20"
                onClick={() => handleShift(1)}
              >
                Next stone
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 rounded-[40px] opacity-70 blur-3xl"
              style={{ boxShadow: `0 0 180px ${palette.ring}` }}
              aria-hidden
            />
            <div className="relative rounded-[32px] border border-white/20 bg-black/40 px-6 py-8 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-[0.4em] text-white/60">Live capture</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.slug}
                  initial={{ opacity: 0, y: 24, rotate: -4 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: -24, rotate: 4 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="mt-4 flex flex-col items-center gap-5"
                >
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-white/10" aria-hidden />
                    <div className="relative flex size-44 items-center justify-center rounded-full bg-gradient-to-b from-white/35 via-white/5 to-transparent ring-2 ring-white/30">
                      {selected.image ? (
                        <Image src={selected.image} alt={selected.name} width={160} height={160} className="drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)]" />
                      ) : (
                        <span className="text-4xl font-semibold text-white/80">{selected.name.slice(0, 2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center text-sm text-white/70">
                    Sighted moments ago • {selected.theme.toLowerCase()}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="pointer-events-none absolute inset-x-6 -bottom-8 h-16 rounded-full bg-gradient-to-b from-white/30 to-transparent blur-2xl" aria-hidden />
          </div>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Stone stream switcher</p>
            <p className="text-sm font-medium text-foreground">Tap a shard to focus the beam</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              aria-label="Previous stone"
              onClick={() => handleShift(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              aria-label="Next stone"
              onClick={() => handleShift(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {stones.map((stone) => {
            const isActive = stone.slug === selected.slug;
            return (
              <motion.button
                key={stone.slug}
                type="button"
                onClick={() => onSelect(stone.slug)}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-2xl border p-3 text-left",
                  isActive
                    ? "border-primary bg-primary/5 shadow-[0_15px_25px_rgba(59,130,246,0.25)]"
                    : "border-border/60 hover:border-primary/40 hover:bg-primary/5"
                )}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative size-12 overflow-hidden rounded-full border border-border/50 bg-muted/40">
                    {stone.image ? (
                      <Image src={stone.image} alt={stone.name} width={64} height={64} className="object-contain" />
                    ) : (
                      <span className="text-xs font-semibold uppercase text-muted-foreground">{stone.slug}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-foreground">{stone.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{stone.rarity.toLowerCase()}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stone.theme}</p>
                {isActive ? <span className="text-[11px] font-semibold text-primary">Beam locked</span> : <span className="text-[11px] text-muted-foreground">Tap to convert</span>}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[420px] w-full animate-pulse rounded-3xl bg-muted/30" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-44 animate-pulse rounded-2xl bg-muted/30" />
        ))}
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-[0_10px_25px_rgba(15,23,42,0.08)] dark:bg-card/60">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold leading-tight">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function formatRelative(timestamp: number) {
  const delta = Date.now() - timestamp;
  const minutes = Math.floor(delta / 60000);
  if (minutes <= 0) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
