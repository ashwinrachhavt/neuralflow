import { useEffect, useMemo, useRef } from "react";

import { useMutation } from "@tanstack/react-query";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/react";
import { Bold, CheckSquare, Code2, Heading2, Italic, List, Quote, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlashCommand, slashCommandOptions } from "@/components/editor/slash-command";

export type CardTiptapEditorProps = {
  taskId?: string;
  initialContent?: string | null;
  noteId?: string | null;
  className?: string;
};

type SavePayload = { contentJson: JSONContent; contentMarkdown: string };

export function CardTiptapEditor({ taskId: _taskId, initialContent, noteId, className }: CardTiptapEditorProps) {
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

  const aiContinueMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Continue this text:\n\n${text}` }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      return res.json();
    },
    onSuccess: (data, _variables) => {
      editor?.commands.insertContent(data.text);
      toast.success("AI generated content");
    },
    onError: () => toast.error("Failed to generate content"),
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
      Placeholder.configure({ placeholder: "Type '/' for commands or start writing..." }),
      SlashCommand.configure(slashCommandOptions),
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
        class: "prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none min-h-[480px] leading-7 focus:outline-none",
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
    // Only set content if it's different to avoid cursor jumps, or if it's the first load
    if (editor.getText() === "" && parsedContent) {
      editor.commands.setContent(parsedContent, { emitUpdate: false });
    }
  }, [editor, parsedContent]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  // AI Event Listeners
  useEffect(() => {
    const onContinue = () => {
      const text = editor?.getText();
      if (text) {
        toast.info("AI is writing...");
        aiContinueMutation.mutate(text.slice(-500)); // Send last 500 chars context
      } else {
        toast.error("Write something first!");
      }
    };

    window.addEventListener('ai-continue-writing', onContinue);
    return () => window.removeEventListener('ai-continue-writing', onContinue);
  }, [editor, aiContinueMutation]);

  if (!noteId) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Attach a note to unlock the rich editor experience.
      </div>
    );
  }

  const items = buildToolbar(editor);

  return (
    <div className={cn("rounded-xl border border-border/70 bg-card/70 shadow-sm", className)}>
      {/* Floating Toolbar (Optional, maybe hide if minimalistic) */}
      <div className="flex flex-wrap gap-2 border-b border-border/60 bg-background/70 p-3 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={item.active ? "secondary" : "ghost"}
            size="sm"
            className="rounded-full h-8 px-2.5"
            onClick={() => item.command?.()}
            disabled={!editor}
          >
            <item.icon className="size-4" />
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">AI Powered</span>
          <Sparkles className="size-3 text-indigo-500" />
        </div>
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
