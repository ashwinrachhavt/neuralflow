export const metadata = { title: 'Settings', description: '' };

import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function SettingsPage() {
  return (
    <PageShell size="sm">
      <SectionHeader title="Settings" />
      <EmptyState title="Coming soon" />
    </PageShell>
  );
}
