"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rewardPulseVariants, rewardRingVariants, rewardShardVariants } from "@/lib/animations/rewards";

export type SwitcherImage = { src: string; name: string; slug: string };

type Props = {
  images: SwitcherImage[];
  selectedSlug?: string;
  onSelectedSlugChange?: (slug: string) => void;
};

export function StoneSwitcher({ images, selectedSlug, onSelectedSlugChange }: Props) {
  const [index, setIndex] = React.useState(0);
  const [converting, setConverting] = React.useState(false);
  const [showReward, setShowReward] = React.useState(false);

  React.useEffect(() => {
    if (!images.length) setIndex(0);
  }, [images]);

  // Respect externally controlled selection when provided
  React.useEffect(() => {
    if (!images.length || !selectedSlug) return;
    const i = images.findIndex((im) => im.slug === selectedSlug);
    if (i >= 0) setIndex(i);
  }, [images, selectedSlug]);

  if (!images.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
        No images found in /public to switch.
      </div>
    );
  }

  const current = images[index % images.length];
  const applyIndex = (i: number) => {
    const clamped = (i + images.length) % images.length;
    setIndex(clamped);
    const slug = images[clamped]?.slug;
    if (slug && onSelectedSlugChange) onSelectedSlugChange(slug);
  };
  const prev = () => applyIndex(index - 1);
  const next = () => applyIndex(index + 1);

  async function handleConvert() {
    if (converting) return;
    setConverting(true);
    setShowReward(true);
    // Simulate a short conversion
    await new Promise((r) => setTimeout(r, 900));
    setConverting(false);
    // Let the reward effect finish before hiding
    setTimeout(() => setShowReward(false), 650);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="truncate">{current.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev} aria-label="Previous">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={next} aria-label="Next">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto grid w-full max-w-xl place-items-center">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-muted/20">
            {/* Use a plain img to avoid needing explicit dimensions */}
            <img src={current.src} alt={current.name} className="h-full w-full object-contain" />

            {/* Reward overlay */}
            <AnimatePresence>
              {showReward && (
                <motion.div
                  className="pointer-events-none absolute inset-0 grid place-items-center"
                  initial="initial"
                  animate="animate"
                >
                  {/* pulse halo */}
                  <motion.div
                    variants={rewardPulseVariants({ duration: 0.8 })}
                    className="absolute h-3/5 w-3/5 rounded-full bg-amber-400/15 blur-2xl"
                  />
                  {/* expanding rings */}
                  <motion.div
                    variants={rewardRingVariants({ duration: 0.9 })}
                    className="absolute h-2/3 w-2/3 rounded-full border-2 border-amber-400/60"
                  />
                  <motion.div
                    variants={rewardRingVariants({ duration: 0.9, delay: 0.1 })}
                    className="absolute h-[80%] w-[80%] rounded-full border border-amber-300/40"
                  />
                  {/* shards */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.span
                      key={i}
                      variants={rewardShardVariants(i, { duration: 0.85 })}
                      className="absolute h-1.5 w-3 rotate-12 rounded-full bg-amber-300 shadow-sm"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4">
            <Button className="gap-2" onClick={handleConvert} disabled={converting}>
              <Sparkles className="size-4" /> {converting ? "Converting…" : "Convert to reward"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
