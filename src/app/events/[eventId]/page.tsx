import { EventPageClient } from "@/components/events/EventPageClient";

export const metadata = {
  title: "Event",
  description: "Edit event notes",
};

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventPageClient eventId={eventId} />;
}

