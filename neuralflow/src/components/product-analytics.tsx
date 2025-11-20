"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function ProductAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? "";

  useEffect(() => {
    if (!plausibleDomain) {
      return;
    }

    const windowWithPlausible = window as Window & {
      plausible?: (event: string, options?: Record<string, unknown>) => void;
    };

    windowWithPlausible.plausible?.("pageview");
  }, [pathname, queryString]);

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
