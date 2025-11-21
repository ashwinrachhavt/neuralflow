import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, className, action }: Props) {
  return (
    <div className={cn("rounded-xl border border-dashed p-6 text-center", className)}>
      {icon ? <div className="mb-2 flex justify-center">{icon}</div> : null}
      <h3 className="text-sm font-medium">{title}</h3>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

