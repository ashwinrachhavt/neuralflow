"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GEM_ICON_PATHS, GEM_META, GemSlug } from "@/lib/gamification/catalog";
import Image from "next/image";

interface GemRewardPopupProps {
    slug: GemSlug | null;
    flavorText?: string;
    onClose: () => void;
}

export function GemRewardPopup({ slug, flavorText, onClose }: GemRewardPopupProps) {
    const [step, setStep] = useState<"hidden" | "reveal" | "collect">("hidden");

    useEffect(() => {
        if (slug) {
            setStep("reveal");
            // Auto-collect after a delay
            const timer = setTimeout(() => {
                handleCollect();
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setStep("hidden");
        }
    }, [slug]);

    const handleCollect = () => {
        setStep("collect");
        setTimeout(onClose, 800); // Wait for exit animation
    };

    if (!slug) return null;

    const meta = GEM_META[slug];
    const iconPath = GEM_ICON_PATHS[slug];

    return (
        <AnimatePresence>
            {step === "reveal" && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={handleCollect}
                >
                    <div className="relative flex flex-col items-center text-center p-8 max-w-md w-full">
                        {/* Glow Effect */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 0.5 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/40 rounded-full blur-3xl"
                        />

                        {/* Gem Image */}
                        <motion.div
                            initial={{ scale: 0.5, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 100 }}
                            className="relative z-10 mb-6"
                        >
                            <div className="relative h-48 w-48 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                {/* Fallback to a simple div if image fails, but try Image first */}
                                <Image
                                    src={iconPath}
                                    alt={meta.name}
                                    fill
                                    className="object-contain"
                                    onError={(e) => {
                                        // Fallback logic if needed, for now we assume paths are valid
                                        // e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        </motion.div>

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="relative z-10 space-y-2"
                        >
                            <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                                {meta.name}
                            </h2>
                            <p className="text-lg text-white/90 font-medium">{meta.theme}</p>

                            {flavorText && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1, duration: 0.8 }}
                                    className="mt-4 text-sm text-white/70 italic max-w-xs mx-auto leading-relaxed"
                                >
                                    &ldquo;{flavorText}&rdquo;
                                </motion.p>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                            className="mt-8 text-xs text-white/40 uppercase tracking-widest"
                        >
                            Click to Collect
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
