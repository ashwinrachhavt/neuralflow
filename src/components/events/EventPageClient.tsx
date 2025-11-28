"use client";

import { useMemo, useState } from "react";
import { useMyCalendar } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { SmartTipTapEditor } from "@/components/editor/SmartTipTapEditor";
import { ArrowLeft } from "lucide-react";

export function EventPageClient({ eventId }: { eventId: string }) {
  const { data, isLoading } = useMyCalendar();
  const event = useMemo(() => data?.events.find((e) => e.id === eventId), [data?.events, eventId]);
  const [title, setTitle] = useState<string>(() => event?.title ?? "");
  const [savingTitle, setSavingTitle] = useState(false);

  async function saveTitle(next: string) {
    if (!event) return;
    setSavingTitle(true);
    try {
      const body = {
        title: next,
        type: event.type,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location ?? null,
        tags: event.tags ?? [],
        descriptionMarkdown: event.descriptionMarkdown ?? "",
      };
      await fetch(`/api/calendar/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // ignore
    } finally {
      setSavingTitle(false);
    }
  }

  if (isLoading) return <div className="px-6 py-8 text-sm text-muted-foreground">Loading event…</div>;
  if (!event) return <div className="px-6 py-8 text-sm text-muted-foreground">Event not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => history.back()}>
          <ArrowLeft className="mr-1 size-4" /> Back
        </Button>
        <div className="flex-1 px-2">
          <input
            className="w-full bg-transparent text-2xl font-bold tracking-tight outline-none"
            defaultValue={event.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              setTitle(v);
              if (v && v !== event.title) saveTitle(v);
            }}
            placeholder="Event title"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(event.startAt).toLocaleString()} → {new Date(event.endAt).toLocaleString()}
        </div>
      </div>

      <SmartTipTapEditor
        initialContent={event.descriptionMarkdown ?? ""}
        entity={{ type: "event", eventId: event.id, fullEvent: event }}
      />

      <div className="mt-3 text-xs text-muted-foreground">
        Tip: Use '/' for commands, or click AI buttons to rewrite/summarize.
      </div>
    </div>
  );
}

