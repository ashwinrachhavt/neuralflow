import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl"; // width control
};

const WIDTHS: Record<NonNullable<Props["size"]>, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function Container({ children, className, size = "lg" }: Props) {
  return (
    <div className={cn("mx-auto px-6", WIDTHS[size], className)}>{children}</div>
  );
}

