"use client";

import { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

// Lazy-load framer-motion features to trim the initial bundle.
// We use domMax to support layout animations, AnimatePresence, etc.
const loadFeatures = () =>
  import("@/lib/motion-features").then((m) => m.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}

