"use client";

import { Variants } from "framer-motion";

export type RewardAnimationOptions = {
  duration?: number;
  delay?: number;
};

// Simple pulsing halo for a reward object
export function rewardPulseVariants(opts: RewardAnimationOptions = {}): Variants {
  const { duration = 0.9, delay = 0 } = opts;
  return {
    initial: { opacity: 0, scale: 0.9 },
    animate: {
      opacity: [0, 1, 0],
      scale: [0.9, 1.08, 1.12],
      transition: { duration, delay, ease: "easeOut" },
    },
  };
}

// Radiating ring that expands and fades
export function rewardRingVariants(opts: RewardAnimationOptions = {}): Variants {
  const { duration = 0.8, delay = 0 } = opts;
  return {
    initial: { opacity: 0.5, scale: 0.6 },
    animate: {
      opacity: [0.6, 0.15, 0],
      scale: [0.6, 1.3, 1.8],
      transition: { duration, delay, ease: "easeOut" },
    },
  };
}

// Floating shard pieces; each gets unique delay/trajectory
export function rewardShardVariants(i: number, opts: RewardAnimationOptions = {}): Variants {
  const { duration = 0.9, delay = 0 } = opts;
  const angle = (i / 10) * Math.PI * 2;
  const radius = 60 + (i % 5) * 10;
  const dx = Math.cos(angle) * radius;
  const dy = Math.sin(angle) * radius;
  return {
    initial: { opacity: 0, x: 0, y: 0, scale: 0.6, rotate: 0 },
    animate: {
      opacity: [0, 1, 0],
      x: [0, dx * 0.6, dx],
      y: [0, dy * 0.6, dy],
      rotate: [0, 20 + i * 8],
      scale: [0.6, 1, 0.8],
      transition: { duration, delay: delay + (i * 0.03), ease: "easeOut" },
    },
  };
}

