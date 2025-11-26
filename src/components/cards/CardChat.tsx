"use client";

import * as React from 'react';
import { useChat } from '@ai-sdk/react';

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse, MessageActions, MessageAction } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputSubmit, PromptInputFooter, PromptInputTools, PromptInputBody } from '@/components/ai-elements/prompt-input';
import { ModelSelector } from '@/components/ai-elements/model-selector';
import { CopyIcon, RefreshCcwIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CardChatContext = {
  title: string;
  descriptionMarkdown?: string | null;
  primaryTopic?: string | null;
  topics?: string[] | null;
  projectTitle?: string | null;
  columnTitle?: string | null;
};

export function CardChat({ taskId, cardContext }: { taskId: string; cardContext?: CardChatContext }) {
  const [model, setModel] = React.useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('card-chat-model') || 'gpt-4o';
    return 'gpt-4o';
  });

  const [input, setInput] = React.useState('');

  // @ts-ignore - custom API endpoint not typed
  const { messages, sendMessage, status, regenerate } = useChat({
    api: `/api/ai/cards/${taskId}/chat`,
    body: { model },
    initialMessages: [],
    streamProtocol: 'sse',
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    // Send as UI message with text part for SSE UI stream
    // @ts-ignore - UI message shape is accepted by sendMessage
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
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
    <div className="flex flex-col h-[500px] border rounded-xl overflow-hidden bg-background shadow-sm">
      {/* Header / Context */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Assistant</span>
          {cardContext?.projectTitle && (
            <>
              <span>•</span>
              <span>{cardContext.projectTitle}</span>
            </>
          )}
        </div>
        <ModelSelector
          value={model}
          onChange={(v) => {
            setModel(v);
            try { localStorage.setItem('card-chat-model', v); } catch { /* ignore */ }
          }}
        />
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden relative bg-background">
        <Conversation className="h-full p-4">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                <p className="text-sm">Ask me to refine the task, create a plan, or summarize context.</p>
              </div>
            ) : (
              messages.map((msg) => {
                // Extract text from parts array or fallback to content (for text stream)
                const textParts = (msg as any).parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text) || [];
                const textContent = (textParts.length ? textParts.join('') : ((msg as any).content ?? '')) as string;

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
                          <CopyIcon className="size-3" />
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

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/10">
        <div className="relative">
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message… Enter to send • Shift+Enter for newline • Cmd/Ctrl+Enter to send"
          />
          <div className="absolute bottom-2 right-2">
            <PromptInputSubmit
              onClick={handleSubmit}
              disabled={!input.trim() || status === 'streaming'}
              status={status}
            />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
