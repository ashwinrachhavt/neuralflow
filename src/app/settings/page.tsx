export const metadata = { title: 'Settings', description: '' };

import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { SchedulerPrefs } from './SchedulerPrefs';

export default function SettingsPage() {
  return (
    <PageShell size="sm">
      <SectionHeader title="Settings" />
      <SchedulerPrefs />
    </PageShell>
  );
}
