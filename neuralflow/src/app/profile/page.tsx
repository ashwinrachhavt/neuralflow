import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { GamificationWidget } from "@/components/gamification/widget";
import { GemDashboard } from "@/components/gamification/gem-dashboard";
import { TodoList } from "@/components/todo-list";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeader } from "@/components/section-header";

export const metadata = {
  title: "Profile",
  description: "Your tasks and Hall of Fame in one place.",
};

export default function ProfilePage() {
  return (
    <PageShell>
      <SectionHeader
        title="Profile"
        description="Consolidated view of your tasks and gems."
      />

      <SignedIn>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <TodoList />
          </div>
          <div className="space-y-6">
            <GamificationWidget />
            <GemDashboard />
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button>Sign in to view your profile</Button>
        </SignInButton>
      </SignedOut>
    </PageShell>
  );
}
