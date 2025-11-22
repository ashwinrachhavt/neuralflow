"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

const isPlausibleEnabled = Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN);

function sendPlausibleEvent(name: string, props?: AnalyticsProps) {
  if (!isPlausibleEnabled || typeof window === "undefined") return;
  if (!window.plausible) return;

  const filteredProps = Object.fromEntries(
    Object.entries(props ?? {}).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>;

  window.plausible(name, Object.keys(filteredProps).length ? { props: filteredProps } : undefined);
}

export function useProductAnalytics() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const trackEvent = useCallback(
    (name: string, props?: AnalyticsProps) => {
      const enrichedProps = {
        route: pathname ?? "/",
        auth: isSignedIn ? "authenticated" : "anonymous",
        ...props,
      };

      track(name, enrichedProps);
      sendPlausibleEvent(name, enrichedProps);
    },
    [pathname, isSignedIn],
  );

  return { trackEvent };
}
