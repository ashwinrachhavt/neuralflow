"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useUpdateCardDescription } from "@/hooks/api";
import { Wand2 } from "lucide-react";

function toInitialHTML(text: string): string {
  const safe = (text || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = safe.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
  if (paragraphs.length === 0) return "<p></p>";
  return `<p>${paragraphs.join("</p><p>")}</p>`;
}

export function CardDescriptionEditor({
  taskId,
  initial,
  className,
}: { taskId: string; initial: string; className?: string }) {
  const updateDesc = useUpdateCardDescription();
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: "Write details, subtasks, notes…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: toInitialHTML(initial),
    editorProps: {
      attributes: {
        class: cn("prose dark:prose-invert max-w-none focus:outline-none", "min-h-[120px] whitespace-pre-wrap"),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(toInitialHTML(initial), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const save = () => {
    if (!editor) return;
    const text = editor.getText();
    updateDesc.mutate({ taskId, descriptionMarkdown: text });
  };

  const enrich = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ai/cards/${taskId}/enrich`, { method: 'POST' });
      if (!res.ok) throw new Error('Unable to enrich task');
      return (await res.json()) as { descriptionMarkdown: string };
    },
    onSuccess: (data) => {
      editor?.commands.setContent(toInitialHTML(data.descriptionMarkdown), false);
      save();
    },
  });

  return (
    <div className={cn("rounded-xl border border-border/60 bg-background/60 p-3", className)}>
      {editor ? (
        <>
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex items-center gap-1 rounded border bg-background/80 p-1 shadow">
              <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
              <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
              <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolbarButton>
              <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
              <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
              <ToolbarButton active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>☑︎ Tasks</ToolbarButton>
              <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarButton>
              <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>Code</ToolbarButton>
            </div>
          </BubbleMenu>
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="flex items-center gap-2 rounded border bg-background/80 px-2 py-1 text-xs shadow">
              <span className="text-muted-foreground">/</span>
              <button className="rounded px-2 py-1 hover:bg-muted/50" onClick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()}>Heading</button>
              <button className="rounded px-2 py-1 hover:bg-muted/50" onClick={() => editor!.chain().focus().toggleTaskList().run()}>Tasks</button>
              <button className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted/50" onClick={() => enrich.mutate()}>
                <Wand2 className="size-3.5" /> Enrich
              </button>
            </div>
          </FloatingMenu>
        </>
      ) : null}

      <EditorContent editor={editor} onBlur={save} />
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={save} disabled={updateDesc.isPending}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => enrich.mutate()} disabled={enrich.isPending} className="gap-1">
          <Wand2 className="size-4" /> Enrich
        </Button>
      </div>
    </div>
  );
}

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={cn("rounded px-2 py-1 text-xs", active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

