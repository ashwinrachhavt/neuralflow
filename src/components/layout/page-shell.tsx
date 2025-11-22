import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

export function PageShell({ children, className, size = "lg" }: Props) {
  return (
    <main className={cn("py-6 md:py-8", className)}>
      <Container size={size}>{children}</Container>
    </main>
  );
}

