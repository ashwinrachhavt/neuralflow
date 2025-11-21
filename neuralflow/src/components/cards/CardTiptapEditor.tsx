"use client";

import { useEffect, useMemo, useRef } from "react";

import { useMutation } from "@tanstack/react-query";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/react";
import { Bold, CheckSquare, Code2, Heading2, Italic, List, Quote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CardTiptapEditorProps = {
  initialContent?: string | null;
  noteId?: string | null;
  className?: string;
};

type SavePayload = { contentJson: JSONContent; contentMarkdown: string };

export function CardTiptapEditor({ initialContent, noteId, className }: CardTiptapEditorProps) {
  const parsedContent = useMemo<JSONContent | string>(() => {
    if (!initialContent) return "";
    try {
      return JSON.parse(initialContent) as JSONContent;
    } catch (_err) {
      return initialContent;
    }
  }, [initialContent]);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveMutation = useMutation({
    mutationFn: async (payload: SavePayload) => {
      if (!noteId) return;
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Unable to save note");
      return res.json();
    },
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: {},
      }),
      TaskList.configure({ HTMLAttributes: { class: "not-prose space-y-1" } }),
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Write your notes or task details…" }),
    ],
    content: parsedContent,
    onUpdate({ editor }) {
      if (!noteId) return;
      const payload: SavePayload = { contentJson: editor.getJSON(), contentMarkdown: editor.getText() };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveMutation.mutate(payload), 500);
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[320px] focus:outline-none",
      },
    },
    editable: !!noteId,
  });

  useEffect(() => {
    if (!editor) return;
    if (!parsedContent) {
      editor.commands.clearContent();
      return;
    }
    editor.commands.setContent(parsedContent, { emitUpdate: false });
  }, [editor, parsedContent]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  if (!noteId) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Attach a note to unlock the rich editor experience.
      </div>
    );
  }

  const items = buildToolbar(editor);

  return (
    <div className={cn("rounded-xl border bg-white/70 shadow-sm", className)}>
      <div className="flex flex-wrap gap-2 border-b bg-slate-50/80 p-3">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={item.active ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full"
            onClick={() => item.command?.()}
            disabled={!editor}
          >
            <item.icon className="size-4" />
            {item.label}
          </Button>
        ))}
      </div>
      <div className="p-4">
        <EditorContent editor={editor} />
        <p className="mt-2 text-xs text-muted-foreground">
          {saveMutation.isPending ? "Saving…" : "Changes autosave as you type."}
        </p>
      </div>
    </div>
  );
}

type ToolbarButton = {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  command?: () => void;
};

type ToolbarConfig = {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: (editor: Editor) => boolean;
  command: (editor: Editor) => void;
};

function buildToolbar(editor: Editor | null): ToolbarButton[] {
  if (!editor)
    return TOOLBAR_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      active: false,
    }));
  return TOOLBAR_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.isActive(editor),
    command: () => item.command(editor),
  }));
}

const TOOLBAR_ITEMS: ToolbarConfig[] = [
  {
    id: "heading",
    label: "Heading",
    icon: Heading2,
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "bold",
    label: "Bold",
    icon: Bold,
    isActive: (editor) => editor.isActive("bold"),
    command: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    label: "Italic",
    icon: Italic,
    isActive: (editor) => editor.isActive("italic"),
    command: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "bullet",
    label: "Bullets",
    icon: List,
    isActive: (editor) => editor.isActive("bulletList"),
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "check",
    label: "Checklist",
    icon: CheckSquare,
    isActive: (editor) => editor.isActive("taskList"),
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: "code",
    label: "Code",
    icon: Code2,
    isActive: (editor) => editor.isActive("codeBlock"),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "quote",
    label: "Callout",
    icon: Quote,
    isActive: (editor) => editor.isActive("blockquote"),
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
];
