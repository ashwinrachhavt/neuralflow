import { Suspense } from 'react';
import CalendarPageClient from './CalendarPageClient';

export const metadata = {
  title: 'Calendar',
  description: 'Plan your week and edit event notes',
};

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>}>
      <CalendarPageClient />
    </Suspense>
  );
}

