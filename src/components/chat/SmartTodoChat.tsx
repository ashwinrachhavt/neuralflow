"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse, MessageActions, MessageAction } from "@/components/ai-elements/message";
import { PromptInputTextarea, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { useMyTodos, type MyTodo, useMarkDone } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Clipboard, Check as CheckIcon, RefreshCcwIcon } from "lucide-react";
import { ChainOfThought, type ThoughtStep } from "@/components/ai-elements/chain-of-thought";

export function SmartTodoChat() {
  const [input, setInput] = React.useState("");
  const [showReasoning, setShowReasoning] = React.useState(false);

  // General chat endpoint that includes TODO context + tools
  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const { data, isLoading } = useMyTodos('TODO');
  const todos: MyTodo[] = data?.tasks ?? [];
  const markDone = useMarkDone();

  // Derive a lightweight, high-level reasoning summary for UI only
  const steps: ThoughtStep[] = React.useMemo(() => {
    const hasAny = status === 'streaming' || messages.length > 0;
    if (!hasAny) return [];
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    const lastText = (lastAssistant as any)?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '';
    const applied = /\bmarked as done\b|\btask\s*"?.+"?\s*created\b|\bcreated\s+task\b|\badded\s+to\s+board\b|\bcompleted\b/i.test(lastText);
    return [
      { id: '1', label: 'Understand request', status: status === 'streaming' ? 'active' : 'complete' },
      { id: '2', label: 'Review current todos', status: todos.length ? 'complete' : 'pending' },
      { id: '3', label: 'Decide next action', status: status === 'streaming' ? 'active' : (lastAssistant ? 'complete' : 'pending') },
      { id: '4', label: 'Apply changes', status: applied ? 'complete' : 'pending' },
    ];
  }, [messages, status, todos.length]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    // Send UI message with text part for SSE UI stream
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const sendCombo = !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey;
      const cmdSend = (e.metaKey || e.ctrlKey) && !e.shiftKey;
      if (sendCombo || cmdSend) {
        e.preventDefault();
        handleSubmit();
        return;
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Chat column */}
      <div className="md:col-span-2 flex flex-col h-[70vh] border rounded-xl overflow-hidden bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
          <div className="text-sm font-medium">Smart Todo Chat</div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" className="accent-foreground" checked={showReasoning} onChange={(e) => setShowReasoning(e.target.checked)} />
              Reasoning
            </label>
            <span>{status === 'streaming' ? 'Thinking…' : 'Idle'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {/* Integrated high-level reasoning at top of the chat column */}
          {showReasoning && (status === 'streaming' || steps.length > 0) ? (
            <div className="p-3 border-b bg-muted/10">
              <ChainOfThought steps={steps} />
            </div>
          ) : null}
          <Conversation className="h-full p-4">
            <ConversationContent>
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <p className="text-sm">Ask me to plan, add, prioritize, or complete tasks. I already see your current TODOs.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const textParts = (msg as any).parts?.filter((p: any) => p.type === 'text')?.map((p: any) => p.text) || [];
                  const textContent = textParts.length ? textParts.join('') : ((msg as any).content ?? '');
                  return (
                    <Message key={msg.id} from={msg.role as 'user' | 'assistant'}>
                      <MessageContent>
                        <MessageResponse>{textContent}</MessageResponse>
                      </MessageContent>
                      {msg.role === 'assistant' && (
                        <MessageActions>
                          <MessageAction onClick={() => regenerate()} label="Retry">
                            <RefreshCcwIcon className="size-3" />
                          </MessageAction>
                          <MessageAction onClick={() => navigator.clipboard.writeText(textContent)} label="Copy">
                            <Clipboard className="size-3" />
                          </MessageAction>
                        </MessageActions>
                      )}
                    </Message>
                  );
                })
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <div className="p-4 border-t bg-muted/10">
          <div className="relative">
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a message… Enter to send • Shift+Enter for newline • Cmd/Ctrl+Enter to send"
            />
            <div className="absolute bottom-2 right-2">
              <PromptInputSubmit onClick={handleSubmit} disabled={!input.trim() || status === 'streaming'} status={status} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Context / Active todos */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border bg-card">
          <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Active Todos</div>
          <div className="p-3 space-y-2">
            {isLoading ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : todos.length === 0 ? (
              <div className="text-xs text-muted-foreground">No active todos.</div>
            ) : (
              todos.slice(0, 10).map((t) => (
                <div key={t.id} className="rounded-lg border p-2">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>ID: <code className="text-[10px]">{t.id}</code></span>
                    <span>{t.priority}{t.estimatedPomodoros ? ` • ${t.estimatedPomodoros} pom` : ''}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setInput(prev => (prev ? prev + `\nMark task ${t.title} as done (id: ${t.id}).` : `Mark task ${t.title} as done (id: ${t.id}).`))}>Use in chat</Button>
                    <Button size="sm" onClick={() => markDone.mutate(t.id)} disabled={markDone.isPending}>
                      {markDone.isPending ? 'Completing…' : (<><CheckIcon className="mr-1 size-3.5" /> Done</>)}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
