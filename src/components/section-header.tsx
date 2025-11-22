import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn("mb-3 flex flex-col gap-3 md:mb-4 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

