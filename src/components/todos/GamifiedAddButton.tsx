"use client";

import { motion, useAnimation } from "framer-motion";
import { Plus, Check, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { ParticleEffect } from "@/components/effects/ParticleEffect";
import { cn } from "@/lib/utils";

type GamifiedAddButtonProps = {
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    isLoading?: boolean;
    xpToEarn?: number;
    streak?: number;
    className?: string;
};

export function GamifiedAddButton({
    onClick,
    disabled = false,
    isLoading = false,
    xpToEarn = 10,
    streak,
    className,
}: GamifiedAddButtonProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [triggerParticles, setTriggerParticles] = useState(false);
    const controls = useAnimation();

    useEffect(() => {
        if (isSuccess) {
            const timeout = setTimeout(() => setIsSuccess(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [isSuccess]);

    const handleClick = async () => {
        if (disabled || isLoading) return;

        // Trigger success animation
        setTriggerParticles(true);
        setIsSuccess(true);

        // Button pulse animation
        await controls.start({
            scale: [1, 0.95, 1.05, 1],
            transition: { duration: 0.4, times: [0, 0.2, 0.6, 1] },
        });

        // Execute the actual onClick
        await onClick();

        // Reset particle trigger
        setTimeout(() => setTriggerParticles(false), 100);
    };

    return (
        <div className="relative">
            {/* XP/Streak Badge */}
            {(xpToEarn > 0 || streak) && !isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-3 -right-3 z-10 flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm"
                >
                    {streak && (
                        <span className="flex items-center gap-0.5">
                            🔥 {streak}
                        </span>
                    )}
                    {xpToEarn > 0 && (
                        <span className="flex items-center gap-0.5">
                            <Sparkles className="size-2.5" />
                            +{xpToEarn}
                        </span>
                    )}
                </motion.div>
            )}

            {/* Main Button */}
            <motion.button
                type="button"
                onClick={handleClick}
                disabled={disabled || isLoading}
                animate={controls}
                whileHover={
                    !disabled && !isLoading
                        ? {
                            scale: 1.05,
                            boxShadow: "0 0 30px rgba(139, 92, 246, 0.6)",
                        }
                        : {}
                }
                whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
                className={cn(
                    "relative overflow-hidden rounded-2xl px-6 py-3 font-semibold transition-all",
                    "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600",
                    "shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background",
                    className
                )}
            >
                {/* Shimmer Effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                        x: ["-100%", "200%"],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />

                {/* Glow Pulse */}
                <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/10"
                    animate={{
                        opacity: [0, 0.5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Button Content */}
                <span className="relative z-10 flex items-center gap-2 text-white">
                    {isLoading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Plus className="size-4" />
                        </motion.div>
                    ) : isSuccess ? (
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <Check className="size-4" />
                        </motion.div>
                    ) : (
                        <motion.div
                            whileHover={{ rotate: 90 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Plus className="size-4" />
                        </motion.div>
                    )}
                    <span>{isLoading ? "Adding..." : isSuccess ? "Added!" : "Add"}</span>
                </span>

                {/* Particle Effect */}
                <ParticleEffect
                    trigger={triggerParticles}
                    colors={["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]}
                    particleCount={15}
                    duration={800}
                />
            </motion.button>
        </div>
    );
}
