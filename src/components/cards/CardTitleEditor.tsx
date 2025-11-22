"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useUpdateCard } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type CardTitleEditorProps = {
  taskId: string;
  initialTitle: string;
  boardId?: string;
  className?: string;
  placeholder?: string;
};

export function CardTitleEditor({
  taskId,
  initialTitle,
  boardId,
  className,
  placeholder = "Give this work a name",
}: CardTitleEditorProps) {
  const updateCard = useUpdateCard();
  const [value, setValue] = useState(initialTitle);
  const [dirty, setDirty] = useState(false);
  const lastSaved = useRef(initialTitle);

  useEffect(() => {
    setValue(initialTitle);
    lastSaved.current = initialTitle;
  }, [initialTitle]);

  const persist = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === lastSaved.current || updateCard.isPending) return;
    lastSaved.current = trimmed;
    updateCard.mutate({ taskId, title: trimmed, boardId });
    setDirty(false);
  }, [boardId, taskId, updateCard, value]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setDirty(true);
        }}
        onBlur={persist}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            persist();
          }
        }}
        className="border-none px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
        placeholder={placeholder}
      />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {updateCard.isPending ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Saving…
          </>
        ) : dirty ? (
          <>Tap enter to save</>
        ) : (
          <span className="sr-only">Saved</span>
        )}
      </div>
    </div>
  );
}
