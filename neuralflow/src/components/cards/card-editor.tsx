"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import type { JSONContent } from "novel";
import { defaultEditorContent } from "novel";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const NovelEditor = dynamic(async () => {
  const mod = await import("novel");
  return mod.Editor;
}, {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
      <Loader2 className="size-5 animate-spin" />
      <span className="ml-2 text-xs text-muted-foreground">Loading editor…</span>
    </div>
  ),
});

type EditorDocument = JSONContent & Record<string, unknown>;

export type CardEditorPersistPayload = {
  contentJson: EditorDocument;
  title?: string;
};

type CardEditorProps = {
  taskId: string;
  noteId: string | null;
  initialContentJson: EditorDocument | null;
  initialTitle?: string;
  onTitleChange?: (nextTitle: string) => void;
  canEdit?: boolean;
};

const FALLBACK_EDITOR_DOC: EditorDocument = defaultEditorContent as EditorDocument;

export function CardEditor({
  taskId,
  noteId,
  initialContentJson,
  initialTitle,
  onTitleChange,
  canEdit = true,
}: CardEditorProps) {
  const [title, setTitle] = useState(initialTitle ?? "Untitled card");
  const [editorDoc, setEditorDoc] = useState<EditorDocument>(
    initialContentJson ?? FALLBACK_EDITOR_DOC,
  );
  const [editorKey, setEditorKey] = useState(() => `${taskId}-${noteId ?? "draft"}`);
  const [extensions, setExtensions] = useState<any[] | null>(null);

  useEffect(() => {
    setTitle(initialTitle ?? "Untitled card");
  }, [initialTitle]);

  useEffect(() => {
    setEditorDoc(initialContentJson ?? FALLBACK_EDITOR_DOC);
    setEditorKey(`${taskId}-${noteId ?? "draft"}`);
  }, [initialContentJson, noteId, taskId]);

  useEffect(() => {
    let mounted = true;
    import("novel/extensions")
      .then(mod => {
        if (!mounted) return;
        const next = (mod as { defaultExtensions?: any[]; [key: string]: any }).defaultExtensions;
        setExtensions(Array.isArray(next) ? next : []);
      })
      .catch(error => {
        console.warn("[CardEditor] failed to load novel extensions", error);
        setExtensions([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: CardEditorPersistPayload) => {
      if (!noteId) {
        throw new Error("Note is not ready yet – run enrichment first to bootstrap it.");
      }

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to persist card document");
      }

      return (await response.json()) as { updatedAt: string } | undefined;
    },
    onSuccess: () => {
      toast.success("Card document saved");
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : "Unable to save");
    },
  });

  const isSaving = mutation.isPending;

  const statusLabel = useMemo(() => {
    if (mutation.isPending) return "Saving…";
    if (mutation.isSuccess) return "All changes saved";
    if (mutation.isError) return "Save failed";
    return "Idle";
  }, [mutation.isError, mutation.isPending, mutation.isSuccess]);

  const handleTitleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const next = event.target.value.trim() || "Untitled card";
      setTitle(next);
      onTitleChange?.(next);
      if (noteId) {
        mutation.mutate({ contentJson: editorDoc, title: next });
      }
    },
    [editorDoc, mutation, noteId, onTitleChange],
  );

  const handleDebouncedUpdate = useCallback(
    (json: EditorDocument) => {
      if (!noteId) return;
      mutation.mutate({ contentJson: json, title });
    },
    [mutation, noteId, title],
  );

  if (!noteId) {
    return (
      <div className="flex h-full flex-col gap-4">
        <header className="flex items-center justify-between">
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            defaultValue={title}
            placeholder="Card title"
            onBlur={event => {
              const next = event.target.value.trim() || "Untitled card";
              setTitle(next);
              onTitleChange?.(next);
            }}
            disabled={!canEdit}
          />
          <div className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Awaiting enrichment</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          Run the AI enrichment to scaffold this card's Novel document, then start editing.
        </div>
      </div>
    );
  }

  const completionApi = `/api/ai/card-text?taskId=${taskId}`;

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-center justify-between">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          defaultValue={title}
          placeholder="Card title"
          onBlur={handleTitleBlur}
          disabled={!canEdit}
        />
        <div className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          <span>{statusLabel}</span>
        </div>
      </header>

      <section className="flex-1 overflow-hidden rounded-xl border border-border/60 bg-muted/10 p-1">
        <NovelEditor
          key={editorKey}
          defaultValue={editorDoc}
          extensions={extensions ?? []}
          completionApi={completionApi}
          disableLocalStorage
          editable={canEdit}
          editorProps={{
            attributes: {
              class:
                "prose prose-slate max-w-none dark:prose-invert focus:outline-none px-4 pb-10 pt-6",
            },
          }}
          className="h-full rounded-xl bg-background"
          onUpdate={({ editor }) => {
            const json = editor.getJSON() as EditorDocument;
            setEditorDoc(json);
          }}
          onDebouncedUpdate={({ editor }) => {
            const json = editor.getJSON() as EditorDocument;
            setEditorDoc(json);
            handleDebouncedUpdate(json);
          }}
        />
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDebouncedUpdate(editorDoc)}
          disabled={isSaving}
        >
          {isSaving ? "Saving" : "Save now"}
        </Button>
      </div>
    </div>
  );
}
