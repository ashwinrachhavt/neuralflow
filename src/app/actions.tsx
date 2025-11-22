"use server";

import { createAI, getMutableAIState, streamUI } from "@ai-sdk/rsc";
import { openai } from "@ai-sdk/openai";
import { ReactNode } from "react";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TaskProposal } from "@/components/ai/TaskProposal";

export interface ServerMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ClientMessage {
    id: string;
    role: "user" | "assistant";
    display: ReactNode;
}

export async function submitUserMessage(input: string): Promise<ClientMessage> {
    "use server";

    const history = getMutableAIState();
    history.update((messages: ServerMessage[]) => [
        ...messages,
        { role: "user", content: input },
    ]);

    const result = await streamUI({
        model: openai("gpt-4o"),
        initial: <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="animate-pulse">Thinking...</span></div>,
        system: `You are an expert project manager and planner. Your goal is to help the user break down their objectives into actionable tasks.
    
    When the user asks for a plan:
    1. Analyze the request.
    2. Break it down into 3-5 concrete tasks.
    3. Use the \`proposeTask\` tool to present EACH task to the user.
    4. Provide a brief encouraging summary text after the proposals.
    
    Be concise, professional, and action-oriented.`,
        messages: history.get(),
        text: ({ content, done }: { content: string; done: boolean }) => {
            if (done) {
                history.done((messages: ServerMessage[]) => [
                    ...messages,
                    { role: "assistant", content },
                ]);
            }
            return <div className="text-sm text-foreground/80">{content}</div>;
        },
        tools: {
            proposeTask: {
                description: "Propose a new task to be added to the board",
                parameters: z.object({
                    title: z.string().describe("The title of the task"),
                    description: z.string().optional().describe("A brief description of the task"),
                    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().describe("The priority level"),
                    subtasks: z.array(z.object({ title: z.string() })).optional().describe("List of subtasks"),
                }),
                generate: async ({ title, description, priority, subtasks }: { title: string; description?: string; priority?: "LOW" | "MEDIUM" | "HIGH"; subtasks?: { title: string }[] }) => {
                    return (
                        <TaskProposal
                            title={title}
                            description={description}
                            priority={priority}
                            subtasks={subtasks}
                        />
                    );
                },
            },
        },
    });

    return {
        id: nanoid(),
        role: "assistant",
        display: result.value,
    };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
    actions: {
        submitUserMessage,
    },
    initialUIState: [],
    initialAIState: [],
});
