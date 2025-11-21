"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { PublicImage } from "@/lib/server/list-public-images";

export function JewelsGrid({ images, milestones }: { images: PublicImage[]; milestones: number[] }) {
  // All locked skeleton UI; entice the user with names and milestones
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {images.map((im, idx) => (
        <motion.div
          key={im.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.03 }}
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm"
        >
          <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-2 ring-foreground/10">
            <Image src={im.src} alt={im.name} fill className="object-cover object-center opacity-40 blur-[1px]" />
            <div className="absolute inset-0 grid place-items-center bg-black/40 text-[10px] uppercase tracking-widest text-white">Locked</div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-sm font-semibold line-clamp-1" title={im.name}>Reward: {im.name}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Unlock at {milestones[idx] ?? milestones[milestones.length-1]} pts</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div className="h-full w-0 bg-primary" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

