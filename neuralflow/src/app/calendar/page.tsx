'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const startHour = 7;
const endHour = 21;
const hourHeight = 52;
const allowedTypes = ['FOCUS', 'MEETING', 'PERSONAL', 'BREAK'] as const;

type EventType = (typeof allowedTypes)[number];

type CalendarEvent = {
  id: string;
  title: string;
  type: EventType;
  startAt: string;
  endAt: string;
  descriptionMarkdown?: string | null;
  location?: string | null;
  tags: string[];
};

type FormState = {
  title: string;
  type: EventType;
  startAt: string;
  endAt: string;
  descriptionMarkdown: string;
  location: string;
  tagsInput: string;
};

const typeLabels: Record<EventType, string> = {
  FOCUS: 'Focus',
  MEETING: 'Meeting',
  PERSONAL: 'Personal',
  BREAK: 'Break',
};

const typeStyles: Record<EventType, string> = {
  FOCUS: 'bg-sky-500/80 text-white shadow-sky-500/30',
  MEETING: 'bg-emerald-500/80 text-white shadow-emerald-500/30',
  PERSONAL: 'bg-violet-500/80 text-white shadow-violet-500/30',
  BREAK: 'bg-amber-500/80 text-slate-900 shadow-amber-500/30',
};

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(date: Date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${date.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function formatDayLabel(date: Date) {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, opts);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDateTimeLocal(value?: string | Date) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset();
  const localCopy = new Date(date.getTime() - tzOffset * 60000);
  return localCopy.toISOString().slice(0, 16);
}

function parseInputDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function buildFormState(seed?: Partial<FormState>) {
  const fallbackStart = new Date();
  fallbackStart.setHours(9, 0, 0, 0);
  fallbackStart.setMinutes(0, 0);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setHours(fallbackEnd.getHours() + 1);

  return {
    title: seed?.title ?? '',
    type: seed?.type ?? 'FOCUS',
    startAt: seed?.startAt ?? formatDateTimeLocal(fallbackStart),
    endAt: seed?.endAt ?? formatDateTimeLocal(fallbackEnd),
    descriptionMarkdown: seed?.descriptionMarkdown ?? '',
    location: seed?.location ?? '',
    tagsInput: seed?.tagsInput ?? '',
  };
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()));
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<EventType[]>(() => [...allowedTypes]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [formState, setFormState] = React.useState<FormState>(() => buildFormState());
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);
      return day;
    });
  }, [weekStart]);

  const visibleMinutes = (endHour - startHour) * 60;
  const containerHeight = (visibleMinutes / 60) * hourHeight;

  const loadEvents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const key = weekStart.toISOString().slice(0, 10);
      const res = await fetch(`/api/calendar?weekStart=${key}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load events');
      const data = (await res.json()) as { events?: CalendarEvent[] };
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = React.useMemo(() => {
    if (!filters.length) return events;
    return events.filter((event) => filters.includes(event.type));
  }, [events, filters]);

  const groupedByDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    weekDays.forEach((day) => {
      map.set(day.toDateString(), []);
    });
    filteredEvents.forEach((event) => {
      const date = new Date(event.startAt);
      const key = date.toDateString();
      const group = map.get(key);
      if (group) group.push(event);
    });
    return map;
  }, [weekDays, filteredEvents]);

  const typeCounts = React.useMemo(() => {
    return allowedTypes.reduce((acc, type) => {
      const count = events.filter((event) => event.type === type).length;
      acc[type] = count;
      return acc;
    }, {} as Record<EventType, number>);
  }, [events]);

  const toggleFilter = (type: EventType) => {
    setFilters((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]));
  };

  const openCreateModal = (seedDate?: Date) => {
    const start = seedDate ? new Date(seedDate) : new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setSelectedEvent(null);
    setFormState(
      buildFormState({
        startAt: formatDateTimeLocal(start),
        endAt: formatDateTimeLocal(end),
      }),
    );
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormState(
      buildFormState({
        title: event.title,
        type: event.type,
        startAt: formatDateTimeLocal(event.startAt),
        endAt: formatDateTimeLocal(event.endAt),
        descriptionMarkdown: event.descriptionMarkdown ?? '',
        location: event.location ?? '',
        tagsInput: event.tags.join(', '),
      }),
    );
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    if (!isModalOpen) {
      setFormState(buildFormState());
      setSelectedEvent(null);
      setFormError(null);
    }
  }, [isModalOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const title = formState.title.trim();
    const start = parseInputDate(formState.startAt);
    const end = parseInputDate(formState.endAt);
    if (!title || !start || !end) {
      setFormError('Please provide a title, start, and end time.');
      return;
    }
    if (start >= end) {
      setFormError('Start time must precede end time.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        type: formState.type,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        descriptionMarkdown: formState.descriptionMarkdown.trim(),
        location: formState.location.trim() || null,
        tags: formState.tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const url = selectedEvent ? `/api/calendar/events/${selectedEvent.id}` : '/api/calendar/events';
      const method = selectedEvent ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Unable to save event');
      await loadEvents();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/calendar/events/${selectedEvent.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Unable to delete event');
      await loadEvents();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Calendar</p>
          <h1 className="text-3xl font-semibold">Weekly focus</h1>
          <p className="text-sm text-muted-foreground">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setWeekStart((prev) => {
                const next = new Date(prev);
                next.setDate(next.getDate() - 7);
                return next;
              })
            }
          >
            Prev week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            This week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setWeekStart((prev) => {
                const next = new Date(prev);
                next.setDate(next.getDate() + 7);
                return next;
              })
            }
          >
            Next week
          </Button>
          <Button size="sm" onClick={() => openCreateModal()}>
            + Add block
          </Button>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-2">
        {allowedTypes.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={filters.includes(type) ? 'secondary' : 'outline'}
            onClick={() => toggleFilter(type)}
          >
            <span className="font-semibold">{typeLabels[type]}</span>
            <span className="ml-1 text-muted-foreground">{typeCounts[type]}</span>
          </Button>
        ))}
      </section>

      <Card className="space-y-3">
        <CardHeader className="border-b border-border/60 bg-background/80">
          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
            <div className="px-3 text-xs text-muted-foreground">Times</div>
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="px-3 py-2 text-sm font-semibold">
                <div>{formatDayLabel(day)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="grid h-40 place-items-center border border-dashed border-destructive/60 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
            <div className="flex flex-col">
              {Array.from({ length: endHour - startHour }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-[52px] items-start justify-end pr-2 text-[11px] text-muted-foreground"
                >
                  {`${(startHour + index) % 24}:00`}
                </div>
              ))}
            </div>
            {weekDays.map((day) => {
              const group = groupedByDay.get(day.toDateString()) ?? [];
              return (
                <div
                  key={day.toISOString()}
                  className="relative min-h-[calc(14*52px)] border-l border-border/60 bg-background/90"
                  style={{ height: `${containerHeight}px` }}
                  onClick={() => {
                    openCreateModal(day);
                  }}
                >
                  {Array.from({ length: endHour - startHour }).map((_, index) => (
                    <span
                      key={`${day.toISOString()}-${index}`}
                      className="pointer-events-none absolute left-0 right-0 border-t border-border/60"
                      style={{ top: `${index * hourHeight}px` }}
                    />
                  ))}
                  {group.map((event) => {
                    const start = new Date(event.startAt);
                    const end = new Date(event.endAt);
                    const startMinutes = (start.getHours() * 60 + start.getMinutes()) - startHour * 60;
                    const endMinutes = (end.getHours() * 60 + end.getMinutes()) - startHour * 60;
                    const clippedStart = Math.max(0, startMinutes);
                    const clippedEnd = Math.min(visibleMinutes, endMinutes);
                    if (clippedEnd <= clippedStart) return null;
                    const top = (clippedStart / visibleMinutes) * containerHeight;
                    const height = Math.max(((clippedEnd - clippedStart) / visibleMinutes) * containerHeight, 30);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event);
                        }}
                        className={cn(
                          'absolute left-1 right-1 rounded-2xl p-2 text-left text-xs shadow-lg transition hover:shadow-xl',
                          typeStyles[event.type],
                        )}
                        style={{ top, height }}
                      >
                        <div className="flex items-center justify-between text-[9px] uppercase tracking-wide">
                          <span>{typeLabels[event.type]}</span>
                          <span>{`${formatTime(start)} · ${formatTime(end)}`}</span>
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-tight line-clamp-2">
                          {event.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Loading events…</div>
          ) : null}
        </CardContent>
        <CardDescription className="px-6 py-3 text-sm text-muted-foreground">
          Click any day to schedule a block, then open it from the grid to edit details and add notes.
        </CardDescription>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit block' : 'Add block'}</DialogTitle>
            <DialogDescription>
              Fill in the title, type, and time. Use the notes area to capture meeting context or focus intention.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
              <Input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Block title"
              />
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
              <Select value={formState.type} onValueChange={(value) => setFormState((prev) => ({ ...prev, type: value as EventType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start</label>
              <Input
                type="datetime-local"
                value={formState.startAt}
                onChange={(event) => setFormState((prev) => ({ ...prev, startAt: event.target.value }))}
              />
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">End</label>
              <Input
                type="datetime-local"
                value={formState.endAt}
                onChange={(event) => setFormState((prev) => ({ ...prev, endAt: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</label>
              <Input
                value={formState.location}
                onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="Meeting room, Zoom link…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</label>
              <Input
                value={formState.tagsInput}
                onChange={(event) => setFormState((prev) => ({ ...prev, tagsInput: event.target.value }))}
                placeholder="e.g. planning, async"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</label>
              <Textarea
                value={formState.descriptionMarkdown}
                onChange={(event) => setFormState((prev) => ({ ...prev, descriptionMarkdown: event.target.value }))}
                placeholder="Add context, meeting notes, focus intention…"
                rows={3}
              />
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <DialogFooter className="items-center gap-3">
              {selectedEvent ? (
                <Button variant="destructive" size="sm" type="button" onClick={handleDelete} disabled={isSaving}>
                  Delete
                </Button>
              ) : null}
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={isSaving}>
                {selectedEvent ? 'Save changes' : 'Save block'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
