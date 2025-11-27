import { useState } from "react";

export interface PrismaAgentResult {
    context?: {
        meta?: {
            taskManagerResult?: string;
            toolLog?: Array<{ name: string; input: any }>;
        };
    };
    debug?: {
        rawModelOutput?: string;
        toolCalls?: any[];
        toolResults?: any[];
    };
}

export function usePrismaAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PrismaAgentResult | null>(null);

    const execute = async (prompt: string) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/ai/prisma-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Request failed" }));
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setResult(data);
            return data;
        } catch (err: any) {
            const message = err.message || "Failed to execute agent";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
    };

    return {
        execute,
        reset,
        loading,
        error,
        result,
        response: result?.context?.meta?.taskManagerResult,
        toolCalls: result?.debug?.toolCalls,
    };
}
