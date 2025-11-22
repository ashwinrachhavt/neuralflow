"use client";

import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Props = {
    title: string;
    description?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    subtasks?: { title: string }[];
    boardId?: string; // Optional, defaults to current context if not passed
};

export function TaskProposal({ title, description, priority = "MEDIUM", subtasks = [], boardId }: Props) {
    const [isApproved, setIsApproved] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const qc = useQueryClient();

    // Mutation to create the task
    const createTask = useMutation({
        mutationFn: async () => {
            // Fetch default board if not provided
            let targetBoardId = boardId;
            if (!targetBoardId) {
                const res = await fetch("/api/boards/default");
                if (!res.ok) throw new Error("No default board found");
                const data = await res.json();
                targetBoardId = data.id;
            }

            // Find first column (TODO) - simplified for now
            const boardRes = await fetch(`/api/boards/${targetBoardId}`);
            const boardData = await boardRes.json();
            const columnId = boardData.board.columnOrder[0]; // Default to first column

            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    boardId: targetBoardId,
                    columnId,
                    title,
                    descriptionMarkdown: description,
                    priority,
                    aiPlanned: true,
                    aiSubtasks: subtasks.map(s => ({ title: s.title, estimateMin: 15 })), // Default estimate
                }),
            });

            if (!res.ok) throw new Error("Failed to create task");
            return res.json();
        },
        onSuccess: () => {
            setIsApproved(true);
            toast.success("Task created!");
            qc.invalidateQueries({ queryKey: ["board"] as any });
            qc.invalidateQueries({ queryKey: ["my-todos"] as any });
        },
        onError: () => {
            toast.error("Failed to create task");
        },
    });

    if (isRejected) return null;

    if (isApproved) {
        return (
            <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 opacity-75">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4" />
                    <span className="text-sm font-medium line-through">{title}</span>
                    <span className="ml-auto text-xs">Added to board</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/40 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Sparkles className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Proposal</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priority === 'HIGH' ? 'bg-red-500/10 text-red-600' :
                            priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-600' :
                                'bg-blue-500/10 text-blue-600'
                        }`}>
                        {priority}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                {description && <p className="mb-3 text-sm text-muted-foreground">{description}</p>}

                {subtasks.length > 0 && (
                    <div className="mt-3 space-y-1">
                        {subtasks.map((sub, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="size-1 rounded-full bg-border" />
                                <span>{sub.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border/40 bg-muted/10 p-2">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-red-500"
                    onClick={() => setIsRejected(true)}
                >
                    <X className="mr-1 size-3.5" />
                    Reject
                </Button>
                <Button
                    size="sm"
                    className="h-7 bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => createTask.mutate()}
                    disabled={createTask.isPending}
                >
                    {createTask.isPending ? "Adding..." : (
                        <>
                            <Check className="mr-1 size-3.5" />
                            Approve
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
