"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useChat } from "ai/react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { CardEditor } from "./card-editor";

type CardPanelProps = {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CardPanelQueryResponse = {
  task: {
    id: string;
    title: string;
    descriptionMarkdown: string | null;
    priority: string | null;
    column: {
      id: string;
      title: string;
    } | null;
    tags: string[];
  };
  note: {
    id: string;
    title: string | null;
    contentJson: string | Record<string, unknown> | null;
    contentMarkdown: string | null;
  } | null;
};

export function CardPanel({ taskId, open, onOpenChange }: CardPanelProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, isRefetching } = useQuery<CardPanelQueryResponse>({
    enabled: Boolean(taskId) && open,
    queryKey: ["card", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/cards/${taskId}`);
      if (!response.ok) {
        throw new Error("Unable to load card");
      }
      return (await response.json()) as CardPanelQueryResponse;
    },
    staleTime: 5_000,
  });

  const task = data?.task;
  const note = data?.note;

  const parsedContentJson = useMemo(() => {
    if (!note?.contentJson) return null;
    if (typeof note.contentJson === "object") return note.contentJson;
    try {
      return JSON.parse(note.contentJson as string) as Record<string, unknown>;
    } catch (error) {
      console.warn("Failed to parse note.contentJson", error);
      return null;
    }
  }, [note?.contentJson]);

  const updateTask = useMutation({
    mutationFn: async (payload: { title: string }) => {
      if (!taskId) return;
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Unable to update task title");
      }
      return (await response.json()) as { id: string; title: string } | undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["card", taskId] });
      toast.success("Card title updated");
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : "Update failed");
    },
  });

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      if (!taskId) return;
      updateTask.mutate({ title: nextTitle });
    },
    [taskId, updateTask],
  );

  const enrichMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) {
        throw new Error("Select a card before running enrichment");
      }

      const response = await fetch(`/api/cards/${taskId}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to enrich card");
      }

      return (await response.json()) as { noteId: string; summary?: string } | undefined;
    },
    onSuccess: async () => {
      toast.success("Card enriched with AI");
      if (taskId) {
        await queryClient.invalidateQueries({ queryKey: ["card", taskId] });
      }
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : "Unable to enrich card");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full max-h-full flex-col gap-4 p-0" side="right">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-border bg-background/80 px-6 py-4">
          <div>
            <SheetTitle>Card details</SheetTitle>
            {task ? (
              <p className="text-sm text-muted-foreground">{task.column?.title ?? "Unassigned column"}</p>
            ) : null}
          </div>
          {isLoading || isRefetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading</span>
            </div>
          ) : null}
        </SheetHeader>

        <div className="grid h-full flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
          <main className="flex h-full flex-col">
            {isLoading || !task ? (
              <CardPanelPlaceholder />
            ) : (
              <div className="flex h-full flex-col gap-6">
                <Card className="flex flex-col gap-4 border-none shadow-none">
                  <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                    <span>{task.priority ?? "Priority TBD"}</span>
                    <span>•</span>
                    <span>{task.tags.join(", ") || "No tags"}</span>
                  </div>
                  <CardEditor
                    taskId={task.id}
                    noteId={note?.id ?? null}
                    initialContentJson={parsedContentJson}
                    initialTitle={note?.title ?? task.title}
                    onTitleChange={handleTitleChange}
                    canEdit={Boolean(note?.id)}
                  />
                </Card>
              </div>
            )}
          </main>

          <aside className="flex h-full flex-col gap-4">
            <AgentSidebar
              taskId={taskId}
              notePreview={note?.contentMarkdown ?? task?.descriptionMarkdown ?? ""}
            />

            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => enrichMutation.mutate()}
              disabled={!taskId || enrichMutation.isPending}
            >
              {enrichMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {enrichMutation.isPending ? "Enriching…" : "Auto-enrich with AI"}
            </Button>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CardPanelPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-[420px] w-full" />
    </div>
  );
}

type AgentSidebarProps = {
  taskId: string | null;
  notePreview: string;
};

type CardAgentMode = "summarize" | "subtasks" | "flashcards" | "explain" | "custom";

const MODE_DEFINITIONS: Array<{ key: CardAgentMode; label: string; helper?: string }> = [
  {
    key: "summarize",
    label: "Summarize",
    helper: "Crisp bullet summary of the current card",
  },
  {
    key: "subtasks",
    label: "Subtasks",
    helper: "Actionable checklist you can paste back into the doc",
  },
  {
    key: "flashcards",
    label: "Flashcards",
    helper: "Question/answer pairs for spaced repetition",
  },
  {
    key: "explain",
    label: "Explain",
    helper: "Gentle explanation for a curious beginner",
  },
  {
    key: "custom",
    label: "Custom",
    helper: "Ask the agent anything about this card",
  },
];

const MODE_PROMPTS: Record<CardAgentMode, string> = {
  summarize: "Summarize this card in 3–5 bullet points.",
  subtasks: "Suggest a checklist of subtasks with clear verbs.",
  flashcards: "Create 3–5 flashcards (question + answer) derived from this card.",
  explain: "Explain the card as if the reader is 10 years old.",
  custom: "",
};

function AgentSidebar({ taskId, notePreview }: AgentSidebarProps) {
  const [mode, setMode] = useState<CardAgentMode>("summarize");
  const [hasTriggered, setHasTriggered] = useState(false);

  const {
    messages,
    append,
    isLoading,
    input,
    setInput,
    setMessages,
    handleInputChange,
  } = useChat({
    api: "/api/ai/card-agent",
    body: { cardId: taskId, mode },
  });

  useEffect(() => {
    setMessages([]);
    setHasTriggered(false);
  }, [mode, taskId, setMessages]);

  const handleRunMode = useCallback(async () => {
    if (!taskId) {
      toast.error("Select a card to talk to its agent");
      return;
    }

    const prompt = mode === "custom" ? input.trim() : MODE_PROMPTS[mode];
    if (!prompt) {
      toast.info("Ask a question first");
      return;
    }

    if (mode !== "custom") {
      setMessages([]);
    }

    try {
      await append({ id: `${Date.now()}`, role: "user", content: prompt });
      if (mode === "custom") {
        setInput("");
      }
      setHasTriggered(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach the agent";
      toast.error(message);
    }
  }, [append, input, mode, setInput, setMessages, taskId]);

  const renderContent = useCallback((content: unknown) => {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map(item => {
          if (!item) return "";
          if (typeof item === "string") return item;
          if (typeof item === "object" && "text" in item) {
            return String(item.text ?? "");
          }
          return "";
        })
        .join("");
    }
    if (typeof content === "object" && "text" in (content as { text?: string })) {
      return String((content as { text?: string }).text ?? "");
    }
    return JSON.stringify(content);
  }, []);

  const preparedPreview = useMemo(
    () => (notePreview ? notePreview.slice(0, 400) : "No document content yet. Use enrichment to seed the card."),
    [notePreview],
  );

  const disablingReason = useMemo(() => {
    if (!taskId) return "Pick a card first.";
    return null;
  }, [taskId]);

  return (
    <Card className="flex flex-1 flex-col gap-4 border-border/80 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Card agent</span>
        {isLoading ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Thinking
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {MODE_DEFINITIONS.map(option => (
          <Button
            key={option.key}
            size="sm"
            variant={option.key === mode ? "default" : "outline"}
            onClick={() => setMode(option.key)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {MODE_DEFINITIONS.find(entry => entry.key === mode)?.helper}
      </p>

      <div className="flex-1 overflow-hidden rounded-md border border-border/60 bg-muted/20">
        <div className="h-full overflow-y-auto p-3 text-sm leading-relaxed">
          {messages.length === 0 ? (
            <div className="space-y-3 text-xs text-muted-foreground">
              <p>No agent exchanges yet.</p>
              <p>
                Context preview:
                <br />
                <span className="font-mono text-[11px] text-foreground/80">{preparedPreview}</span>
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id ?? `${index}`}
                className={
                  message.role === "assistant"
                    ? "mb-3 rounded-md bg-primary/10 p-3 text-sm text-foreground"
                    : "mb-3 rounded-md bg-background p-3 text-xs text-muted-foreground"
                }
              >
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                  {message.role}
                </span>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {renderContent(message.content)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <form className="flex flex-col gap-2" onSubmit={event => {
        event.preventDefault();
        void handleRunMode();
      }}>
        {mode === "custom" ? (
          <Textarea
            placeholder="Ask a question or give the agent an instruction"
            value={input}
            onChange={handleInputChange}
            rows={4}
          />
        ) : (
          <div className="rounded-md border border-dashed border-border/70 bg-background/60 p-2 text-xs text-muted-foreground">
            <span className="block font-semibold text-foreground">Prompt</span>
            <p>{MODE_PROMPTS[mode]}</p>
          </div>
        )}

        <Button type="submit" size="sm" disabled={isLoading || Boolean(disablingReason)}>
          {mode === "custom" ? "Send" : hasTriggered ? "Run again" : "Run"}
        </Button>
        {disablingReason ? (
          <p className="text-[11px] text-muted-foreground">{disablingReason}</p>
        ) : null}
      </form>
    </Card>
  );
}
