"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 px-6 py-16">
      <div className="w-full max-w-5xl">
        <GooeyText
          texts={["Dao", "Focus is Flow"]}
          morphTime={1.2}
          cooldownTime={0.35}
          textClassName="font-semibold tracking-tight text-5xl md:text-7xl"
        />
      </div>

      <p className="mt-10 max-w-xl text-center text-sm text-muted-foreground">
        Plan days, protect focus, and make progress that compounds. Start with a brain dump; let Dao shape it into a flow you can actually do.
      </p>

      <div className="mt-10">
        <HoverStartModal />
      </div>

      <BackgroundBlobs />
    </main>
  );
}

function HoverStartModal({ className }: { className?: string }) {
  return (
    <SignInButton mode="modal" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      <button className={cn("group", className)}>
        <motion.div
          initial={{ width: 52 }}
          whileHover={{ width: 140 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative flex h-12 items-center gap-2 overflow-hidden rounded-full border border-border bg-background/70 px-3 shadow backdrop-blur"
        >
          <motion.div
            initial={{ x: 0 }}
            whileHover={{ x: 0 }}
            className="flex size-8 items-center justify-center rounded-full bg-foreground text-background"
          >
            <ArrowRight className="size-4" />
          </motion.div>
          <motion.span
            initial={{ x: -12, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none pr-3 text-sm font-medium text-foreground"
          >
            Start
          </motion.span>
        </motion.div>
      </button>
    </SignInButton>
  );
}

function BackgroundBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-20 bottom-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
    </div>
  );
}
