"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { GemRewardPopup } from "./GemRewardPopup";
import { GemSlug } from "@/lib/gamification/catalog";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface GamificationContextType {
    triggerAction: (action: "TASK_COMPLETE" | "POMODORO_COMPLETE", resourceId: string) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationOverlay({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const [rewardSlug, setRewardSlug] = useState<GemSlug | null>(null);
    const [rewardFlavor, setRewardFlavor] = useState<string>("");

    const triggerAction = async (action: "TASK_COMPLETE" | "POMODORO_COMPLETE", resourceId: string) => {
        if (!user?.id) return;

        try {
            const payload: any = { userId: user.id, action };
            if (action === "TASK_COMPLETE") payload.taskId = resourceId;
            if (action === "POMODORO_COMPLETE") payload.sessionId = resourceId;

            const res = await fetch("/api/ai/gamify-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                console.error("Gamification failed", await res.text());
                return;
            }

            const data = await res.json();
            console.log("Gamification response:", data); // DEBUG
            const awards = data.context?.gamifyResult?.awards || [];

            if (awards.length > 0) {
                setRewardSlug(awards[0] as GemSlug);
                setRewardFlavor(data.context?.gamifyResult?.flavorText || "");
            } else {
                // Optional: Subtle toast for XP gain if no gem
                const xp = data.context?.gamifyResult?.xpDelta;
                if (xp > 0) toast.success(`+${xp} XP`);
            }
        } catch (e) {
            console.error("Gamification error", e);
        }
    };

    return (
        <GamificationContext.Provider value={{ triggerAction }}>
            {children}
            <GemRewardPopup
                slug={rewardSlug}
                flavorText={rewardFlavor}
                onClose={() => setRewardSlug(null)}
            />
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error("useGamification must be used within a GamificationOverlay");
    }
    return context;
}
