export const metadata = { title: 'Settings', description: '' };

import { PageShell } from '@/components/layout/page-shell';
import { SectionHeader } from '@/components/section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TASK_TOPICS } from '@/lib/ai/taxonomy';
import { toast } from 'sonner';
import * as React from 'react';

export default function SettingsPage() {
  return (
    <PageShell size="sm">
      <SectionHeader title="Settings" />
      <SchedulerPrefs />
    </PageShell>
  );
}

type Prefs = {
  workStartHour: number;
  gym: { enabled: boolean; startHour: number; endHour: number; days: number[] };
  shallow?: { enabled: boolean; startHour: number; title?: string };
  favoriteTopics: string[];
};

function SchedulerPrefs() {
  const [prefs, setPrefs] = React.useState<Prefs | null>(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const res = await fetch('/api/scheduler/prefs');
      if (!res.ok) return;
      const data = await res.json();
      setPrefs(data.prefs);
    })();
  }, []);

  async function save() {
    if (!prefs) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scheduler/prefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefs }) });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Saved');
    } catch (e:any) {
      toast.error(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (!prefs) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Scheduler Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Work start hour</label>
            <Input type="number" min={5} max={12} value={prefs.workStartHour} onChange={(e) => setPrefs({ ...prefs, workStartHour: Number(e.target.value || 9) })} />
            <p className="text-xs text-muted-foreground mt-1">Earliest time for focus suggestions</p>
          </div>
          <div>
            <label className="text-sm font-medium">Gym window</label>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={prefs.gym.enabled} onChange={(e) => setPrefs({ ...prefs, gym: { ...prefs.gym, enabled: e.target.checked } })} /> Enable</label>
              <Input className="w-20" type="number" min={0} max={23} value={prefs.gym.startHour} onChange={(e) => setPrefs({ ...prefs, gym: { ...prefs.gym, startHour: Number(e.target.value || 19) } })} />
              <span>→</span>
              <Input className="w-20" type="number" min={0} max={23} value={prefs.gym.endHour} onChange={(e) => setPrefs({ ...prefs, gym: { ...prefs.gym, endHour: Number(e.target.value || 21) } })} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Preferred evening window (24h). Days: 0–Sun … 6–Sat</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[0,1,2,3,4,5,6].map(d => (
                <button key={d} onClick={() => {
                  const days = prefs.gym.days.includes(d) ? prefs.gym.days.filter(x=>x!==d) : prefs.gym.days.concat(d);
                  setPrefs({ ...prefs, gym: { ...prefs.gym, days } });
                }}>
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] ${prefs.gym.days.includes(d) ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>{d}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Evening shallow (vibe) sessions</label>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={prefs.shallow?.enabled ?? true} onChange={(e) => setPrefs({ ...prefs, shallow: { enabled: e.target.checked, startHour: prefs.shallow?.startHour ?? 18, title: prefs.shallow?.title ?? 'Vibe coding' } })} /> Enable</label>
              <Input className="w-20" type="number" min={16} max={22} value={prefs.shallow?.startHour ?? 18} onChange={(e) => setPrefs({ ...prefs, shallow: { enabled: prefs.shallow?.enabled ?? true, startHour: Number(e.target.value || 18), title: prefs.shallow?.title ?? 'Vibe coding' } })} />
              <Input className="flex-1" placeholder="Title (e.g., Vibe coding)" value={prefs.shallow?.title ?? 'Vibe coding'} onChange={(e) => setPrefs({ ...prefs, shallow: { enabled: prefs.shallow?.enabled ?? true, startHour: prefs.shallow?.startHour ?? 18, title: e.target.value } })} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">After this hour, scheduler suggests light or creative sessions over deep focus.</p>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Favorite topics</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {TASK_TOPICS.map(t => (
              <button key={t} onClick={() => {
                const fav = prefs.favoriteTopics.includes(t) ? prefs.favoriteTopics.filter(x=>x!==t) : prefs.favoriteTopics.concat(t);
                setPrefs({ ...prefs, favoriteTopics: fav });
              }}>
                <span className={`inline-block rounded px-2 py-0.5 text-[10px] ${prefs.favoriteTopics.includes(t) ? 'bg-indigo-500/10 text-indigo-700' : 'bg-muted text-muted-foreground'}`}>{t}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save preferences'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
