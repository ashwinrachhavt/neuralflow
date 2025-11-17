import { AiPlannerLauncher } from "@/components/ai-planner-dialog";
import type { ReactNode } from "react";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AiPlannerLauncher />
    </>
  );
}
