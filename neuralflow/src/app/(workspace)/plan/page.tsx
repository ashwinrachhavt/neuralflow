import { DaoPlanner } from "@/components/dao-planner";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";

export default function PlanPage() {
  return (
    <PageShell>
      <SectionHeader
        title="Plan"
        description="Describe your day in natural language. Dao suggests tasks and awards."
      />
      <SignedIn>
        <DaoPlanner />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button>Sign in to plan with Dao</Button>
        </SignInButton>
      </SignedOut>
    </PageShell>
  );
}
