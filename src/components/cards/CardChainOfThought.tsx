"use client";

import { useMemo, useState } from "react";
import { ChainOfThought } from "@/components/ai-elements/chain-of-thought";
import { ModelSelector } from "@/components/ai-elements/model-selector";

export function CardChainOfThought({ taskId: _taskId }: { taskId: string }) {
  const [model, setModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('card-chat-model') || 'gpt-5.1';
    }
    return 'gpt-5.1';
  });

  const steps = useMemo(() => ([
    { id: 's1', label: 'Understand the task', description: 'Read title and note context', status: 'complete' as const },
    { id: 's2', label: 'Search related references', description: 'Skim prior notes and tags', status: 'active' as const },
    { id: 's3', label: 'Propose next actions', description: 'Draft 2–3 concrete steps', status: 'pending' as const },
  ]), []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Reasoning</div>
        <ModelSelector value={model} onChange={(v) => { setModel(v); try { localStorage.setItem('card-chat-model', v); } catch { /* ignore */ } }} />
      </div>
      <ChainOfThought defaultOpen steps={steps} />
    </div>
  );
}
