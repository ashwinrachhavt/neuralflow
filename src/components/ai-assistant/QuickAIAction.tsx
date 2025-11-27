"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { usePrismaAgent } from "@/hooks/usePrismaAgent";
import { Loader2, Sparkles } from "lucide-react";

interface QuickAIActionProps {
    trigger?: React.ReactNode;
    suggestedPrompts?: string[];
    title?: string;
    description?: string;
}

export function QuickAIAction({
    trigger,
    suggestedPrompts = [],
    title = "AI Assistant",
    description = "Ask me anything about your tasks and calendar.",
}: QuickAIActionProps) {
    const [open, setOpen] = React.useState(false);
    const [prompt, setPrompt] = React.useState("");
    const { execute, loading, error, response, reset } = usePrismaAgent();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;
        await execute(prompt);
    };

    const handleSuggestedPrompt = async (suggested: string) => {
        setPrompt(suggested);
        await execute(suggested);
    };

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => {
            setPrompt("");
            reset();
        }, 200);
    };

    return (
        <>
            {trigger ? (
                <div onClick={() => setOpen(true)}>{trigger}</div>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(true)}
                    className="gap-2"
                >
                    <Sparkles className="h-4 w-4" />
                    AI Assistant
                </Button>
            )}

            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Suggested Prompts */}
                        {suggestedPrompts.length > 0 && !response && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Suggested prompts:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedPrompts.map((suggested, idx) => (
                                        <Button
                                            key={idx}
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleSuggestedPrompt(suggested)}
                                            disabled={loading}
                                            className="text-xs"
                                        >
                                            {suggested}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Type your question or request..."
                                className="min-h-[100px]"
                                disabled={loading}
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">
                                    {loading ? "Processing..." : "Press Enter to submit"}
                                </p>
                                <div className="flex gap-2">
                                    {response && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setPrompt("");
                                                reset();
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    )}
                                    <Button type="submit" size="sm" disabled={!prompt.trim() || loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loading ? "Thinking..." : "Ask AI"}
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {/* Error Display */}
                        {error && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Response Display */}
                        {response && (
                            <div className="rounded-md border bg-muted/50 p-4 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Response
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{response}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
