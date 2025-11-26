"use client";

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';

export function CardAIChat({ taskId }: { taskId: string }) {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({ api: `/api/ai/cards/${taskId}/chat`, streamProtocol: 'sse' });

  return (
    <div className="space-y-3">
      <Conversation className="border rounded-md p-2 max-h-[300px] overflow-auto">
        <ConversationContent>
          {messages.map((m) => {
            const parts = (m as any).parts?.filter((p: any) => p.type === 'text')?.map((p: any) => p.text) || [];
            const text = parts.length ? parts.join('') : ((m as any).content ?? '');
            return (
              <Message key={m.id} from={m.role as any}>
                <MessageContent>
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}
          {messages.length === 0 ? (
            <div className="text-xs text-muted-foreground">Ask for a breakdown, a quick summary, or next tiny step.</div>
          ) : null}
        </ConversationContent>
      </Conversation>
      <form onSubmit={handleSubmit} className="space-y-2">
        <PromptInput onSubmit={() => {}}>
          <PromptInputBody>
            <PromptInputTextarea value={input} onChange={handleInputChange} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit onClick={() => { /* submit through form */ }} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </form>
    </div>
  );
}
