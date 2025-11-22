"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Image } from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
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
  const lowlight = useMemo(() => createLowlight(common), []);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Write details, subtasks, notes…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true, protocols: ["http", "https", "mailto"] }),
      Underline,
      Highlight,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HorizontalRule,
      Typography,
      CharacterCount,
      Image.configure({ allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  content: toInitialHTML(initial),
  immediatelyRender: false,
  editorProps: {
      attributes: {
        class: cn("prose dark:prose-invert max-w-none focus:outline-none", "min-h-[120px] whitespace-pre-wrap"),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(toInitialHTML(initial), false);
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
        <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border bg-background/70 p-1">
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
          <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolbarButton>
          <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</ToolbarButton>
          <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
          <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
          <ToolbarButton active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>☑︎ Tasks</ToolbarButton>
          <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarButton>
          <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>Code</ToolbarButton>
          <ToolbarButton onClick={() => {
            const prev = editor.getAttributes('link')?.href as string | undefined;
            const url = window.prompt('Set link URL', prev ?? 'https://');
            if (url === null) return;
            if (url === '' || url === 'http://' || url === 'https://') {
              editor.chain().focus().unsetLink().run();
            } else {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}>🔗</ToolbarButton>
          <div className="mx-1 h-5 w-px bg-border" />
          <button className="rounded px-2 py-1 text-xs hover:bg-muted/60" onClick={() => editor!.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button className="rounded px-2 py-1 text-xs hover:bg-muted/60" onClick={() => editor!.chain().focus().setHorizontalRule().run()}>HR</button>
          <button className="rounded px-2 py-1 text-xs hover:bg-muted/60" onClick={() => editor!.chain().focus().toggleCodeBlock().run()}>Code block</button>
          <button className="rounded px-2 py-1 text-xs hover:bg-muted/60" onClick={() => editor!.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()}>Table</button>
          <button className="rounded px-2 py-1 text-xs hover:bg-muted/60" onClick={() => {
            const url = window.prompt('Image URL');
            if (!url) return;
            editor!.chain().focus().setImage({ src: url }).run();
          }}>Image</button>
          <div className="ml-auto inline-flex overflow-hidden rounded border">
            <button className="px-2 py-1 text-xs hover:bg-muted/60" title="Align left" onClick={() => editor!.chain().focus().setTextAlign('left').run()}>⟸</button>
            <button className="px-2 py-1 text-xs hover:bg-muted/60" title="Align center" onClick={() => editor!.chain().focus().setTextAlign('center').run()}>╳</button>
            <button className="px-2 py-1 text-xs hover:bg-muted/60" title="Align right" onClick={() => editor!.chain().focus().setTextAlign('right').run()}>⟹</button>
          </div>
          <button className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted/60" onClick={() => enrich.mutate()}>
            <Wand2 className="size-3.5" /> Enrich
          </button>
        </div>
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
