"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackFunnelEvent,
  UTM_KEYS,
  type FunnelEvent,
  type FunnelUtm,
} from "@/lib/funnel-analytics";

/**
 * Lightweight marketing tracking.
 *
 * Capabilities:
 *   1. UTM persistence — reads `utm_*` query params on landing, drops
 *      them in a first-party cookie (`ral_utm`, 30-day) so attribution
 *      survives the signup round-trip and can be attached when an
 *      authenticated funnel event establishes the user attribution.
 *   2. landing_view event — fires once per marketing route transition. Sends
 *      to /api/marketing/event with the path + utm fields. Failure
 *      is silent (we'd rather lose a beacon than break a landing).
 *
 * No third-party scripts and no fingerprinting. MarketingShell mounts this
 * once for the public route group, so pathname must be a dependency.
 */
export function MarketingTracking({ event = "landing_view" }: { event?: FunnelEvent }) {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    try {
      const url = new URL(window.location.href);
      const utm: FunnelUtm = {};
      for (const key of UTM_KEYS) {
        const v = url.searchParams.get(key);
        if (v) utm[key] = v.slice(0, 64);
      }
      // Persist UTM the first time we see it; later landings shouldn't
      // overwrite the original-touch attribution.
      if (Object.keys(utm).length > 0) {
        const existing = document.cookie.split("; ").find(c => c.startsWith("ral_utm="));
        if (!existing) {
          const value = encodeURIComponent(JSON.stringify({ ...utm, t: Date.now(), p: window.location.pathname }));
          // 30-day TTL, Lax so signup form submission still includes it.
          const secure = window.location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `ral_utm=${value}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax${secure}`;
        }
      }
      trackFunnelEvent(event, { utm });
    } catch {
      // any failure here is acceptable — no telemetry is worth breaking the landing
    }
  }, [event, pathname]);
  return null;
}

/** CTA-click tracker. Wrap a CTA element with onClick to fire a
 *  beacon BEFORE navigation. Server logs the click_target. */
export function trackCtaClick(target: string): void {
  trackFunnelEvent("cta_click", { target });
}
