import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const metadata = {
  title: 'Today',
  description: 'Daily execution view for your flow',
};

export default function DashboardPage() {
  return (
    <PageShell>
      <SectionHeader
        title="Today’s Flow"
        description={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        actions={
          <div className="flex gap-2 text-sm">
            <Link className="rounded border px-3 py-2" href="/boards">Open Board</Link>
            
          </div>
        }
      />
      <SignedOut>
        <SignInButton mode="modal"><Button variant="outline">Sign in</Button></SignInButton>
      </SignedOut>
      <SignedIn>
        <DashboardShell />
      </SignedIn>
    </PageShell>
  );
}

// Client shell moved to components/dashboard/dashboard-shell.tsx
