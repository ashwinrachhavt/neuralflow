"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import type { Editor } from "@tiptap/react";
import { Bold, CheckSquare, Code2, Heading2, Italic, List, Quote, Sparkles, X, Link as LinkIcon, Underline as UnderlineIcon, Highlighter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SlashCommand, slashCommandOptions } from "@/components/editor/slash-command";
import { tiptapJSONToMarkdown } from "@/lib/markdown";

export type SmartTipTapSavePayload = { contentJson: JSONContent; contentMarkdown: string };

export type SmartTipTapEditorProps = {
  initialContent?: string | null;
  className?: string;
  // Provide entity info to persist content, or a custom onSave for full control
  entity?:
    | { type: "note"; noteId: string }
    | { type: "event"; eventId: string; fullEvent?: any }
    | { type: "custom" };
  onSave?: (payload: SmartTipTapSavePayload) => Promise<void> | void;
  // Layout/styling options
  frame?: 'default' | 'bare';
  expanded?: boolean; // when true, fills available vertical space
};

export function SmartTipTapEditor({ initialContent, entity, className, onSave, frame = 'default', expanded = false }: SmartTipTapEditorProps) {
  const parsedContent = useMemo<JSONContent | string>(() => {
    if (!initialContent) return "";
    try {
      return JSON.parse(initialContent) as JSONContent;
    } catch (_err) {
      if (typeof initialContent === 'string' && looksLikeMarkdown(initialContent)) {
        return markdownToHTMLSimple(initialContent);
      }
      return initialContent;
    }
  }, [initialContent]);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveMutation = useMutation({
    mutationFn: async (payload: SmartTipTapSavePayload) => {
      if (onSave) {
        await onSave(payload);
        return;
      }
      // Default entity-aware persistence
      if (entity?.type === "note") {
        const res = await fetch(`/api/notes/${entity.noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Unable to save note");
        return res.json();
      }
      if (entity?.type === "event") {
        // PUT full event with updated descriptionMarkdown to match existing API semantics
        const base = entity.fullEvent ?? {};
        const body = {
          title: base.title ?? "",
          type: base.type ?? "FOCUS",
          startAt: base.startAt,
          endAt: base.endAt,
          location: base.location ?? null,
          tags: base.tags ?? [],
          descriptionMarkdown: payload.contentMarkdown,
        };
        const res = await fetch(`/api/calendar/events/${entity.eventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Unable to save event notes");
        return res.json().catch(() => ({}));
      }
    },
  });

  const abortRef = useRef<AbortController | null>(null);

  const aiAction = useMutation({
    mutationFn: async (prompt: string) => {
      // Try streaming first
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/ai/generate/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error("no-stream");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            full += chunk;
            // Insert progressively at the cursor/selection position
            editor?.chain().focus().insertContent(chunk).run();
          }
        }
        return { text: full } as { text: string };
      } catch (_streamErr) {
        // Fallback to non-streaming endpoint
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("AI generation failed");
        return res.json() as Promise<{ text: string }>;
      }
    },
    onSuccess: () => {
      toast.success("AI generated content");
    },
    onError: (e: any) => {
      if (e?.name === "AbortError") return; // canceled by user
      toast.error("AI request failed");
    },
    onSettled: () => {
      abortRef.current = null;
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
      CodeBlockLowlight.configure({ lowlight: createLowlight() }),
      Link.configure({ autolink: true, openOnClick: true, linkOnPaste: true }),
      Underline,
      Highlight,
      Image,
      HorizontalRule,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "not-prose table-auto w-full" } }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({ HTMLAttributes: { class: "not-prose space-y-1" } }),
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Type '/' for commands or start writing..." }),
      SlashCommand.configure(slashCommandOptions),
    ],
    content: parsedContent,
    onUpdate({ editor }) {
      const json = editor.getJSON();
      const payload: SmartTipTapSavePayload = {
        contentJson: json,
        contentMarkdown: tiptapJSONToMarkdown(json),
      };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveMutation.mutate(payload), 500);
    },
    editorProps: {
      attributes: {
        class: "richtext prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none min-h-[420px] leading-7 focus:outline-none",
      },
      handlePaste(view, event) {
        const text = (event.clipboardData || (window as any).clipboardData)?.getData?.('text/plain');
        if (typeof text === 'string' && looksLikeMarkdown(text)) {
          event.preventDefault();
          const html = markdownToHTMLSimple(text);
          editor?.commands.insertContent(html);
          return true;
        }
        return false;
      },
    },
    editable: true,
  });

  useEffect(() => {
    if (!editor) return;
    if (!parsedContent) {
      editor.commands.clearContent();
      return;
    }
    if (editor.getText() === "" && parsedContent) {
      editor.commands.setContent(parsedContent, { emitUpdate: false });
    }
  }, [editor, parsedContent]);

  useEffect(() => () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); }, []);

  const items = buildToolbar(editor);

  const frameClass = frame === 'bare' ? '' : 'rounded-xl border border-border/70 bg-card/70 shadow-sm';
  return (
    <div className={cn(frameClass, expanded && 'h-full flex flex-col', className)}>
      <div className="flex flex-wrap gap-2 border-b border-border/60 bg-background/70 p-3">
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
        <div className="ml-auto flex items-center gap-2">
          {/* helper to safely fetch selected text */}
          {null}
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => {
              const text = (() => {
                const e = editor;
                if (!e) return "";
                const sel = e.state?.selection;
                if (sel && sel.from !== sel.to) {
                  try { return e.state.doc.textBetween(sel.from, sel.to, "\n"); } catch { /* noop */ }
                }
                return e.getText() || "";
              })();
              if (!text) return toast.error("Write something first");
              aiAction.mutate(`Rewrite this more concisely and clearly:\n\n${text}`);
            }}
          >
            <Sparkles className="mr-1 size-3.5" /> Rewrite
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => {
              const text = (() => {
                const e = editor;
                if (!e) return "";
                const sel = e.state?.selection;
                if (sel && sel.from !== sel.to) {
                  try { return e.state.doc.textBetween(sel.from, sel.to, "\n"); } catch { /* noop */ }
                }
                return e.getText() || "";
              })();
              if (!text) return toast.error("Write something first");
              aiAction.mutate(`Summarize this into 3-5 bullets:\n\n${text}`);
            }}
          >
            <Sparkles className="mr-1 size-3.5" /> Summarize
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => {
              const text = editor?.getText();
              if (!text) return toast.error("Write something first");
              aiAction.mutate(`Continue this text:\n\n${text.slice(-500)}`);
            }}
          >
            <Sparkles className="mr-1 size-3.5" /> Continue
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => {
              const text = (() => {
                const e = editor;
                if (!e) return "";
                const sel = e.state?.selection;
                if (sel && sel.from !== sel.to) {
                  try { return e.state.doc.textBetween(sel.from, sel.to, "\n"); } catch { /* noop */ }
                }
                return e.getText() || "";
              })();
              if (!text) return toast.error("Write something first");
              aiAction.mutate(`Create a concise hierarchical outline of the following. Use markdown headings and bullets:\n\n${text}`);
            }}
          >
            <Sparkles className="mr-1 size-3.5" /> Outline
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => {
              const text = (() => {
                const e = editor;
                if (!e) return "";
                const sel = e.state?.selection;
                if (sel && sel.from !== sel.to) {
                  try { return e.state.doc.textBetween(sel.from, sel.to, "\n"); } catch { /* noop */ }
                }
                return e.getText() || "";
              })();
              if (!text) return toast.error("Write something first");
              aiAction.mutate(`Extract action items as a checklist with clear verbs. Output only a markdown checklist, one task per line:\n\n${text}`);
            }}
          >
            <Sparkles className="mr-1 size-3.5" /> Action Items
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full"
            onClick={() => {
              const text = (() => {
                const e = editor;
                if (!e) return "";
                const sel = e.state?.selection;
                if (sel && sel.from !== sel.to) {
                  try { return e.state.doc.textBetween(sel.from, sel.to, "\n"); } catch { /* noop */ }
                }
                return e.getText() || "";
              })();
              const intro = `Create meeting notes with sections: Goals, Attendees, Agenda, Notes, Decisions, Action Items. Use markdown with headings and concise bullets.`;
              const tail = text ? `\n\nIncorporate this context:\n${text}` : '';
              aiAction.mutate(intro + tail);
            }}
          >
            <Sparkles className="mr-1 size-3.5" /> Meeting Notes
          </Button>
          {aiAction.isPending ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full"
              onClick={() => abortRef.current?.abort()}
            >
              <X className="mr-1 size-3.5" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>
      <div className={cn('p-4', expanded && 'flex-1 min-h-0 overflow-auto')}>
        <EditorContent editor={editor} />
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
    return TOOLBAR_ITEMS.map((item) => ({ id: item.id, label: item.label, icon: item.icon, active: false }));
  return TOOLBAR_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    active: item.isActive(editor),
    command: () => item.command(editor),
  }));
}

const TOOLBAR_ITEMS: ToolbarConfig[] = [
  { id: "heading", label: "Heading", icon: Heading2, isActive: (e) => e.isActive("heading", { level: 2 }), command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "bold", label: "Bold", icon: Bold, isActive: (e) => e.isActive("bold"), command: (e) => e.chain().focus().toggleBold().run() },
  { id: "italic", label: "Italic", icon: Italic, isActive: (e) => e.isActive("italic"), command: (e) => e.chain().focus().toggleItalic().run() },
  { id: "bullet", label: "Bullets", icon: List, isActive: (e) => e.isActive("bulletList"), command: (e) => e.chain().focus().toggleBulletList().run() },
  { id: "check", label: "Checklist", icon: CheckSquare, isActive: (e) => e.isActive("taskList"), command: (e) => e.chain().focus().toggleTaskList().run() },
  { id: "code", label: "Code", icon: Code2, isActive: (e) => e.isActive("codeBlock"), command: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: "quote", label: "Callout", icon: Quote, isActive: (e) => e.isActive("blockquote"), command: (e) => e.chain().focus().toggleBlockquote().run() },
];

function looksLikeMarkdown(s: string) {
  return /(^|\n)\s{0,3}(#{1,6})\s+/.test(s)
    || /(^|\n)\s*[-*+]\s+/.test(s)
    || /(^|\n)\s*\d+\.\s+/.test(s)
    || /\*\*(.+?)\*\*/.test(s)
    || /(^|\n)\s*```/.test(s)
    || /(^|\n)>\s+/.test(s);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Minimal markdown to HTML converter for headings, lists, blockquotes, code fences, bold/italic.
function markdownToHTMLSimple(md: string): string {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];
  let inUL = false, inOL = false, inCode = false;
  for (let raw of lines) {
    const line = raw;
    if (/^\s*```/.test(line)) {
      if (inCode) {
        out.push('</code></pre>');
        inCode = false;
      } else {
        out.push('<pre><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      out.push(escapeHtml(line));
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inUL) { if (inOL) { out.push('</ol>'); inOL = false; } out.push('<ul>'); inUL = true; }
      const item = line.replace(/^\s*[-*+]\s+/, '');
      out.push(`<li>${inlineMd(item)}</li>`);
      continue;
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOL) { if (inUL) { out.push('</ul>'); inUL = false; } out.push('<ol>'); inOL = true; }
      const item = line.replace(/^\s*\d+\.\s+/, '');
      out.push(`<li>${inlineMd(item)}</li>`);
      continue;
    } else {
      if (inUL) { out.push('</ul>'); inUL = false; }
      if (inOL) { out.push('</ol>'); inOL = false; }
    }
    const h = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inlineMd(h[2])}</h${level}>`);
      continue;
    }
    if (/^\s*>\s+/.test(line)) {
      out.push(`<blockquote>${inlineMd(line.replace(/^\s*>\s+/, ''))}</blockquote>`);
      continue;
    }
    if (line.trim() === '') { out.push('<p></p>'); continue; }
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  if (inUL) out.push('</ul>');
  if (inOL) out.push('</ol>');
  if (inCode) out.push('</code></pre>');
  return out.join('\n');
}

function inlineMd(s: string) {
  let t = escapeHtml(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}
