"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ModelSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const MODELS = [
  { id: 'gpt-5.1', label: 'GPT 5.1' },
  { id: 'gpt-4.1', label: 'GPT 4.1' },
  { id: 'gpt-4o', label: 'GPT 4o' },
  { id: 'gpt-4o-mini', label: 'GPT 4o mini' },
];

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-[140px] py-0 text-xs">
          <SelectValue placeholder="Choose model" />
        </SelectTrigger>
        <SelectContent>
          {MODELS.map(m => (
            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

