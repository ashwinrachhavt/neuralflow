"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Stone = { slug: string; name: string; theme: string; rarity: string; image: string | null };

export default function GamifyTestPage() {
  const [stones, setStones] = React.useState<Stone[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/gamify/stones/public", { cache: "no-store" });
        const data = await res.json();
        setStones(Array.isArray(data.stones) ? data.stones : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chosen = stones.find((s) => s.slug === selected) ?? null;

  return (
    <PageShell size="md">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Select a reward</h1>
          <Button
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              // Placeholder: hook your reward grant flow here
              // e.g., POST /api/gamify/grant { slug }
              console.log("Grant reward:", chosen.slug);
            }}
          >
            Use as reward
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-36 animate-pulse" />
            ))
          ) : (
            stones.map((g) => (
              <motion.button
                key={g.slug}
                className="text-left"
                onClick={() => setSelected(g.slug)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`relative h-36 overflow-hidden border transition-shadow ${
                    selected === g.slug
                      ? "border-primary ring-2 ring-primary/40 shadow-lg"
                      : "border-border/70 hover:shadow-md"
                  }`}
                >
                  {/* shimmer ring by rarity */}
                  <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 -z-10 opacity-30 blur-md ${
                      g.rarity === "LEGENDARY"
                        ? "bg-[conic-gradient(from_0deg,theme(colors.amber.400),theme(colors.pink.500),theme(colors.fuchsia.500),theme(colors.amber.400))]"
                        : g.rarity === "EPIC"
                        ? "bg-[conic-gradient(from_0deg,theme(colors.violet.400),theme(colors.indigo.500),theme(colors.blue.500),theme(colors.violet.400))]"
                        : g.rarity === "RARE"
                        ? "bg-[conic-gradient(from_0deg,theme(colors.sky.400),theme(colors.teal.400),theme(colors.sky.400))]"
                        : "bg-[conic-gradient(from_0deg,theme(colors.slate.300),theme(colors.slate.400),theme(colors.slate.300))]"
                    }`}
                  />
                  <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-3">
                    {g.image ? (
                      <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Image src={g.image} alt={g.name} width={56} height={56} />
                      </motion.div>
                    ) : null}
                    <div className="text-center">
                      <div className="text-sm font-medium leading-tight">{g.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {g.rarity.toLowerCase()} • {g.theme}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
