import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "muted" | "primary" | "danger" | "work" | "priority";
  active?: boolean;
  className?: string;
};

export function Chip({ children, variant = "default", active, className }: Props) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium";
  const look = {
    default: "border border-border text-muted-foreground",
    muted: "bg-muted text-muted-foreground",
    primary: "bg-foreground text-background",
    danger: "bg-destructive text-background",
    work: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    priority: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  }[variant];
  return <span className={cn(base, look, active && "ring-1 ring-foreground", className)}>{children}</span>;
}

