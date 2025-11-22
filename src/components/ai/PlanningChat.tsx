"use client";

import { useState } from "react";
import { useActions, useUIState } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Bot } from "lucide-react";
import { nanoid } from "nanoid";

// This type needs to match what we define in the server action/provider
// For now, we'll assume a simple structure
export type Message = {
    id: string;
    role: "user" | "assistant";
    display: React.ReactNode;
};

export function PlanningChat() {
    const [input, setInput] = useState("");
    const [conversation, setConversation] = useUIState();
    const { submitUserMessage } = useActions();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = {
            id: nanoid(),
            role: "user",
            display: (
                <div className="flex w-full justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-primary px-4 py-2 text-primary-foreground">
                        {input}
                    </div>
                </div>
            ),
        };

        setConversation((current: any) => [...current, userMessage]);
        const value = input;
        setInput("");

        const responseMessage = await submitUserMessage(value);
        setConversation((current: any) => [...current, responseMessage]);
    };

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <div className="flex items-center gap-2 border-b p-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                    <Sparkles className="size-4" />
                </div>
                <div>
                    <h2 className="font-semibold">AI Planner</h2>
                    <p className="text-xs text-muted-foreground">Break down goals into tasks</p>
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {conversation.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Bot className="mb-4 size-12 opacity-20" />
                            <p className="text-sm">What are you working on?</p>
                            <p className="text-xs opacity-70">Try "Plan a product launch" or "Break down the Q3 roadmap"</p>
                        </div>
                    )}
                    {conversation.map((message: Message) => (
                        <div key={message.id} className="flex flex-col gap-2">
                            {message.display}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your goal..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim()}>
                        <Send className="size-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
