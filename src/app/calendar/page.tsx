'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import * as Tooltip from '@radix-ui/react-tooltip';
import { useSearchParams } from 'next/navigation';
import { QuickAIAction } from '@/components/ai-assistant/QuickAIAction';

const startHour = 0;
const endHour = 24;
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

// Visual styles per event type. Use translucent backgrounds and themed borders that adapt to light/dark.
const EVENT_STYLES: Record<EventType, { border: string; bg: string; accent: string }> = {
  FOCUS: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    accent: 'bg-emerald-500/70',
  },
  MEETING: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    accent: 'bg-blue-500/70',
  },
  PERSONAL: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    accent: 'bg-amber-500/70',
  },
  BREAK: {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    accent: 'bg-violet-500/70',
  },
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
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
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

function CalendarPageInner() {
  const searchParams = useSearchParams();
  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(new Date())
  );
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<EventType[]>(() => [
    ...allowedTypes,
  ]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] =
    React.useState<CalendarEvent | null>(null);
  const [formState, setFormState] = React.useState<FormState>(() =>
    buildFormState()
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [compact, setCompact] = React.useState(false);

  // Drag-to-create state
  const [dragging, setDragging] = React.useState(false);
  const [dragDayIndex, setDragDayIndex] = React.useState<number | null>(null);
  const [dragRectTop, setDragRectTop] = React.useState<number>(0);
  const [dragStartMin, setDragStartMin] = React.useState<number>(0);
  const [dragCurrentMin, setDragCurrentMin] = React.useState<number>(0);

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
      const key = weekStart.toLocaleDateString('en-CA');
      const res = await fetch(`/api/calendar?weekStart=${key}`, {
        cache: 'no-store',
      });
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

  // If a specific date is provided (?date=YYYY-MM-DD), align the view to that week
  React.useEffect(() => {
    const dStr = searchParams.get('date');
    if (!dStr) return;
    const d = new Date(dStr);
    if (!Number.isNaN(d.getTime())) {
      const s = startOfWeek(d);
      // Only update if different to avoid loops
      if (s.toDateString() !== weekStart.toDateString()) setWeekStart(s);
    }
  }, [searchParams, weekStart]);

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
      const key = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toDateString();
      const group = map.get(key);
      if (group) group.push(event);
    });
    return map;
  }, [weekDays, filteredEvents]);

  const typeCounts = React.useMemo(() => {
    return allowedTypes.reduce(
      (acc, type) => {
        const count = events.filter((event) => event.type === type).length;
        acc[type] = count;
        return acc;
      },
      {} as Record<EventType, number>
    );
  }, [events]);

  const toggleFilter = (type: EventType) => {
    setFilters((prev) =>
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    );
  };

  const openCreateModal = (seedDate?: Date) => {
    // Fallback: top-of-hour from seed date
    const start = seedDate ? new Date(seedDate) : new Date();
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    setSelectedEvent(null);
    setFormState(
      buildFormState({ startAt: formatDateTimeLocal(start), endAt: formatDateTimeLocal(end) })
    );
    setIsModalOpen(true);
  };

  // click handler replaced by drag-to-create

  const snapTo = (min: number, step = 15) => Math.round(min / step) * step;

  const startDragCreate = (day: Date, index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minuteFromTop = Math.max(0, Math.min(visibleMinutes, Math.round((y / containerHeight) * visibleMinutes)));
    const snapped = snapTo(minuteFromTop, 15);
    setDragging(true);
    setDragDayIndex(index);
    setDragRectTop(rect.top);
    setDragStartMin(snapped);
    setDragCurrentMin(snapped);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (ev: MouseEvent) => {
      const y = ev.clientY - dragRectTop;
      const minuteFromTop = Math.max(0, Math.min(visibleMinutes, Math.round((y / containerHeight) * visibleMinutes)));
      setDragCurrentMin(snapTo(minuteFromTop, 15));
    };
    const onUp = () => {
      setDragging(false);
      if (dragDayIndex == null) return;
      const day = new Date(weekDays[dragDayIndex]);
      const startMin = Math.max(0, Math.min(visibleMinutes, Math.min(dragStartMin, dragCurrentMin)));
      let endMin = Math.max(0, Math.min(visibleMinutes, Math.max(dragStartMin, dragCurrentMin)));
      // Ensure a reasonable minimum duration (30 minutes)
      if (endMin - startMin < 30) endMin = Math.min(visibleMinutes, startMin + 60);

      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(startHour * 60 + startMin);
      const end = new Date(day);
      end.setHours(0, 0, 0, 0);
      end.setMinutes(startHour * 60 + endMin);

      setSelectedEvent(null);
      setFormState(buildFormState({ startAt: formatDateTimeLocal(start), endAt: formatDateTimeLocal(end) }));
      setIsModalOpen(true);
      // reset
      setDragDayIndex(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp as any);
    };
  }, [dragging, dragRectTop, dragDayIndex, dragStartMin, dragCurrentMin, containerHeight, visibleMinutes, weekDays]);

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
      })
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
        startAt: new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
          start.getHours(),
          start.getMinutes()
        ).toISOString(),
        endAt: new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate(),
          end.getHours(),
          end.getMinutes()
        ).toISOString(),
        descriptionMarkdown: formState.descriptionMarkdown.trim(),
        location: formState.location.trim() || null,
        tags: formState.tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      const url = selectedEvent
        ? `/api/calendar/events/${selectedEvent.id}`
        : '/api/calendar/events';
      const method = selectedEvent ? 'PUT' : 'POST';
      // optimistic update with temporary id for create; will be reconciled after POST
      const tempId = selectedEvent?.id ?? Math.random().toString();
      const optimisticEvent = {
        id: tempId,
        ...payload,
      };
      if (selectedEvent) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === selectedEvent.id ? optimisticEvent : ev))
        );
      } else {
        setEvents((prev) => [...prev, optimisticEvent]);
      }
      setIsModalOpen(false);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Unable to save event');
      // On create, reconcile temp id with real id from server
      if (method === 'POST') {
        const data = await res.json().catch(() => null);
        const realId = (data && (data.id as string)) || null;
        if (realId) {
          setEvents(prev => prev.map(ev => ev.id === tempId ? { ...ev, id: realId } : ev));
        }
      }
      /* keep modal open for auto-refresh */
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    // optimistic delete
    setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id));
    setIsModalOpen(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Unable to delete event');
      setIsModalOpen(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to delete event'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Calendar
          </p>
          <h1 className="text-3xl font-semibold">Weekly focus</h1>
          <p className="text-sm text-muted-foreground">
            {formatWeekRange(weekStart)}
          </p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
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
          <QuickAIAction
            title="Calendar AI Assistant"
            description="Ask me about your schedule, find free time, or analyze your calendar."
            suggestedPrompts={[
              "What's my busiest day this week?",
              "Show my focus blocks",
              "Find 2-hour slots for deep work",
              "How many meetings do I have?",
            ]}
          />
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
            <span className="ml-1 text-muted-foreground">
              {typeCounts[type]}
            </span>
          </Button>
        ))}
        <Button
          size="sm"
          variant={compact ? 'secondary' : 'outline'}
          onClick={() => setCompact((v) => !v)}
          className="ml-auto"
          title="Toggle compact view"
        >
          {compact ? 'Compact: On' : 'Compact: Off'}
        </Button>
      </section>

      <Tooltip.Provider>
        <Card className="space-y-3">
          <CardHeader className="border-b border-border/60 bg-background/80">
            <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
              <div className="px-3 text-xs text-muted-foreground">Times</div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="px-3 py-2 text-sm font-semibold"
                >
                  <div>{formatDayLabel(day)}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {day.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
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
              {weekDays.map((day, index) => {
                const group = groupedByDay.get(day.toDateString()) ?? [];
                return (
                  <div
                    key={day.toISOString()}
                    className="relative min-h-[calc(14*52px)] border-l border-border/60 bg-background/90"
                    style={{ height: `${containerHeight}px` }}
                    onMouseDown={(e) => startDragCreate(day, index, e)}
                  >
                    {Array.from({ length: endHour - startHour }).map(
                      (_, index) => (
                        <span
                          key={`${day.toISOString()}-${index}`}
                          className="pointer-events-none absolute left-0 right-0 border-t border-border/60"
                          style={{ top: `${index * hourHeight}px` }}
                        />
                      )
                    )}
                    {/* Drag selection overlay */}
                    {dragging && dragDayIndex === index ? (() => {
                      const startMin = Math.min(dragStartMin, dragCurrentMin);
                      const endMin = Math.max(dragStartMin, dragCurrentMin);
                      const top = (startMin / visibleMinutes) * containerHeight;
                      const height = Math.max(((endMin - startMin) / visibleMinutes) * containerHeight, 8);
                      return (
                        <div
                          className="pointer-events-none absolute left-1 right-1 rounded-md border border-primary/40 bg-primary/20"
                          style={{ top, height }}
                        />
                      );
                    })() : null}

                    {group.map((event) => {
                      // Use local wall time directly for placement
                      const start = new Date(event.startAt);
                      const end = new Date(event.endAt);
                      const startMinutes = start.getHours() * 60 + start.getMinutes() - startHour * 60;
                      const endMinutes = end.getHours() * 60 + end.getMinutes() - startHour * 60;
                      const clippedStart = Math.max(0, startMinutes);
                      const clippedEnd = Math.min(visibleMinutes, endMinutes);
                      if (clippedEnd <= clippedStart) return null;
                      const top = (clippedStart / visibleMinutes) * containerHeight;
                      const height = Math.max(((clippedEnd - clippedStart) / visibleMinutes) * containerHeight, 30);
                      const timeRange = `${formatTime(start)} – ${formatTime(end)}`;
                      const startLabel = `${formatTime(start)}`;
                      const endLabel = `${formatTime(end)}`;
                      const isCompact = compact || height < 42;
                      const isUltraCompact = compact ? height < 32 : height < 28;
                      const headerSize = compact ? 'text-[9px]' : 'text-[10px]';
                      const titleCompactSize = compact ? 'text-[10px]' : 'text-[11px]';
                      const titleRegularSize = compact ? 'text-[12px]' : 'text-sm';
                      const dateLabel = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                      const isExpanded = height >= 96;
                      return (
                        <Tooltip.Root delayDuration={200} key={event.id}>
                          <Tooltip.Trigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(event);
                              }}
                              className={cn(
                                'absolute left-1 right-1 overflow-hidden rounded-md border border-dashed text-left text-xs transition',
                                compact ? 'p-1' : 'p-1.5',
                                EVENT_STYLES[event.type].border,
                                EVENT_STYLES[event.type].bg,
                                'text-foreground'
                              )}
                              style={{ top, height }}
                            >
                              {/* left accent bar for quick recognition */}
                              <span
                                className={cn('absolute inset-y-0 left-0 w-1 rounded-l-md', EVENT_STYLES[event.type].accent)}
                                aria-hidden
                              />
                              {isUltraCompact ? (
                                // Very small blocks: show time only
                                <div className={cn('flex h-full items-center justify-center leading-none text-foreground/80', headerSize)}>
                                  <span>{timeRange}</span>
                                </div>
                              ) : isExpanded ? (
                                // Tall blocks: distribute content vertically for better use of space
                                <div className="flex h-full flex-col">
                                  <div className={cn('flex items-center justify-between uppercase tracking-wide leading-none text-foreground/70', headerSize)}>
                                    <span className="truncate pr-1">{typeLabels[event.type]}</span>
                                    <span className="shrink-0 text-foreground/60">{startLabel}</span>
                                  </div>
                                  <div className="flex-1 grid place-items-center px-1">
                                    <div className={cn('w-full text-center font-semibold leading-snug break-words text-foreground', compact ? 'text-[12px]' : 'text-[13px]')}>
                                      {event.title}
                                    </div>
                                  </div>
                                  <div className={cn('mt-auto flex items-center justify-end leading-none text-foreground/60', headerSize)}>
                                    <span>{endLabel}</span>
                                  </div>
                                </div>
                              ) : (
                                // Regular/compact blocks
                                <>
                                  <div className={cn('flex items-center justify-between uppercase tracking-wide leading-none text-foreground/70', headerSize)}>
                                    <span className="truncate pr-1">{typeLabels[event.type]}</span>
                                    <span className="shrink-0 text-foreground/60">{timeRange}</span>
                                  </div>
                                  {!isCompact ? (
                                    <div className={cn('mt-1 font-semibold leading-tight line-clamp-2 text-foreground', titleRegularSize)}>
                                      {event.title}
                                    </div>
                                  ) : (
                                    <div className={cn('mt-0.5 font-medium leading-tight line-clamp-1 text-foreground', titleCompactSize)}>
                                      {event.title}
                                    </div>
                                  )}
                                </>
                              )}
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Content side="top" align="center" className="z-50 rounded-md border border-border/60 bg-background/95 px-3 py-2 text-xs shadow-md">
                            <div className="font-semibold text-foreground">{event.title}</div>
                            <div className="text-foreground/70">{dateLabel} • {timeRange}</div>
                            {event.location ? (
                              <div className="text-foreground/70">📍 {event.location}</div>
                            ) : null}
                            <div className="mt-1 text-[10px] uppercase tracking-wide text-foreground/60">{typeLabels[event.type]}</div>
                            <Tooltip.Arrow className="fill-background" />
                          </Tooltip.Content>
                        </Tooltip.Root>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Loading events…
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Tooltip.Provider>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit block' : 'Add block'}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Title
              </label>
              <Input
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Title"
              />
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </label>
              <Select
                value={formState.type}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    type: value as EventType,
                  }))
                }
              >
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
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </label>
              <Input
                type="datetime-local"
                value={formState.startAt}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    startAt: event.target.value,
                  }))
                }
              />
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                End
              </label>
              <Input
                type="datetime-local"
                value={formState.endAt}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    endAt: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </label>
              <Input
                value={formState.location}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    location: event.target.value,
                  }))
                }
                placeholder="Location"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </label>
              <Input
                value={formState.tagsInput}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    tagsInput: event.target.value,
                  }))
                }
                placeholder="Tags"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </label>
              <Textarea
                value={formState.descriptionMarkdown}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    descriptionMarkdown: event.target.value,
                  }))
                }
                placeholder="Notes"
                rows={3}
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFooter className="items-center gap-3">
              {selectedEvent ? (
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving}
                >
                  Delete
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
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

export default function CalendarPage() {
  return (
    <React.Suspense fallback={<div className="px-4 py-3 text-sm text-muted-foreground">Loading…</div>}>
      <CalendarPageInner />
    </React.Suspense>
  );
}
