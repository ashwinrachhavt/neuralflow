export const metadata = { title: 'Settings', description: 'Profile and preferences' };

import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function SettingsPage() {
  return (
    <PageShell size="sm">
      <SectionHeader title="Settings" description="Profile and preferences" />
      <EmptyState
        title="Coming soon"
        description="Manage your profile, integrations, and personalization here."
      />
    </PageShell>
  );
}
