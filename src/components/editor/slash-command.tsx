import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import {
    CheckSquare,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    MessageSquarePlus,
    Sparkles,
    Text,
    TextQuote,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
//

const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === "ArrowDown") {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === "Enter") {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="z-50 min-w-[300px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {props.items[0]?.title === "Continue writing" ? "AI Actions" : "Basic Blocks"}
            </div>
            {props.items.map((item: any, index: number) => (
                <button
                    key={index}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${index === selectedIndex ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                    onClick={() => selectItem(index)}
                >
                    <div className="flex size-5 items-center justify-center rounded-sm border border-border bg-background">
                        {item.icon}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-medium">{item.title}</span>
                        {item.description && <span className="text-[10px] text-muted-foreground">{item.description}</span>}
                    </div>
                </button>
            ))}
        </div>
    );
});

CommandList.displayName = "CommandList";

const renderItems = () => {
    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
        onStart: (props: any) => {
            component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
            });
        },

        onUpdate: (props: any) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            popup[0].setProps({
                getReferenceClientRect: props.clientRect,
            });
        },

        onKeyDown: (props: any) => {
            if (props.event.key === "Escape") {
                popup[0].hide();
                return true;
            }
            return (component?.ref as any)?.onKeyDown(props);
        },

        onExit: () => {
            popup[0].destroy();
            component?.destroy();
        },
    };
};

export const SlashCommand = Extension.create({
    name: "slashCommand",

    addOptions() {
        return {
            suggestion: {
                char: "/",
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        {
            title: "Continue writing",
            description: "Use AI to generate the next paragraph.",
            icon: <Sparkles className="size-3" />,
            command: ({ editor, range }: any) => {
                // We'll handle the AI call in the main editor component via a callback or event
                // For now, insert a placeholder or trigger a custom event
                editor.chain().focus().deleteRange(range).run();
                window.dispatchEvent(new CustomEvent('ai-continue-writing'));
            },
        },
        {
            title: "Summarize",
            description: "Summarize the current content.",
            icon: <MessageSquarePlus className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).run();
                window.dispatchEvent(new CustomEvent('ai-summarize'));
            },
        },
        {
            title: "Text",
            description: "Just start typing with plain text.",
            icon: <Text className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
            },
        },
        {
            title: "Heading 1",
            description: "Big section heading.",
            icon: <Heading1 className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
            },
        },
        {
            title: "Heading 2",
            description: "Medium section heading.",
            icon: <Heading2 className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
            },
        },
        {
            title: "Heading 3",
            description: "Small section heading.",
            icon: <Heading3 className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
            },
        },
        {
            title: "Bullet List",
            description: "Create a simple bullet list.",
            icon: <List className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: "Numbered List",
            description: "Create a list with numbering.",
            icon: <ListOrdered className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: "Checklist",
            description: "Track tasks with a todo list.",
            icon: <CheckSquare className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
        },
        {
            title: "Quote",
            description: "Capture a quote.",
            icon: <TextQuote className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: "Code",
            description: "Capture a code snippet.",
            icon: <Code className="size-3" />,
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
    ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
};

export const slashCommandOptions = {
    suggestion: {
        items: getSuggestionItems,
        render: renderItems,
    }
}
