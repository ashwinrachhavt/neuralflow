"use client";

import { useEffect, useMemo, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { track } from "@vercel/analytics";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const isPlausibleEnabled = Boolean(plausibleDomain);

function sendPlausible(event: string, props?: Record<string, string | number | boolean | null>) {
  if (!isPlausibleEnabled || typeof window === "undefined") return;
  if (!window.plausible) return;

  const filteredProps = Object.fromEntries(
    Object.entries(props ?? {}).filter(([, value]) => value !== undefined && value !== null),
  );

  window.plausible(
    event,
    Object.keys(filteredProps).length ? { props: filteredProps } : undefined,
  );
}

export function ProductAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const queryString = searchParams?.toString() ?? "";
  const authState = isSignedIn ? "authenticated" : "anonymous";
  const sessionTrackedFor = useRef<string | null>(null);

  const pageProps = useMemo(
    () => ({
      route: pathname ?? "/",
      search: queryString || null,
      auth: authState,
    }),
    [pathname, queryString, authState],
  );

  useEffect(() => {
    if (!isPlausibleEnabled) {
      return;
    }

    sendPlausible("pageview", pageProps);
  }, [pageProps]);

  useEffect(() => {
    const sessionKey = `${authState}`;
    if (sessionTrackedFor.current === sessionKey) {
      return;
    }

    sessionTrackedFor.current = sessionKey;
    const sessionProps = { auth: authState };
    track("user-session", sessionProps);
    sendPlausible("user-session", sessionProps);
  }, [authState]);

  if (!plausibleDomain) {
    return null;
  }

  return (
    <Script
      src="https://plausible.io/js/plausible.js"
      data-domain={plausibleDomain}
      strategy="afterInteractive"
    />
  );
}
