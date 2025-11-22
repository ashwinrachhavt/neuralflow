import type { ReactNode } from "react";

export function RightRail({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {children}
    </div>
  );
}

