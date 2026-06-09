"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { MarketingButton } from "@/components/marketing/marketing-button";

/**
 * Auth-aware CTA pair shown in the homepage hero.
 *
 * Not signed in → "Start in 3 minutes"
 * Signed in    → "Open Raltic" (resolves to first workspace slug)
 */
export function HomeCta(): React.ReactElement {
  const { data: session, isPending } = useSession();
  const [hydrated, setHydrated] = useState(false);
  // null = signed in but workspace lookup hasn't resolved yet. Render a
  // readable fallback instead of briefly pointing at /login. We pick
  // /me's defaultServerSlug first (single round-trip, matches the rest of
  // the app's "where do I land" logic) and fall back to the first server.
  const [openHref, setOpenHref] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        if (me.defaultServerSlug) {
          setOpenHref(`/s/${me.defaultServerSlug}`);
          return;
        }
        const { servers } = await api.listServers();
        if (cancelled) return;
        // No workspace at all → keep them on the homepage and route them
        // through /signup-completion flow instead of dumping to /login.
        setOpenHref(servers[0] ? `/s/${servers[0].slug}` : "/");
      } catch {
        if (!cancelled) setOpenHref("/");
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  // One min-width across pending / signed-out / signed-in so the hero
  // row never jumps when useSession() resolves. 212px fits the signed-out
  // first-value label while signed-in "Open Raltic" stays centered.
  const CTA_MIN = "min-w-[212px]";

  // Keep SSR and the first client render identical. better-auth may resolve
  // a session synchronously from cookies, so checking `session` before mount
  // can otherwise hydrate `/signup` into `Open Raltic` and throw.
  if (!hydrated || isPending) {
    return (
      <MarketingButton href="/signup" className={CTA_MIN} ctaTarget="home_first_value">
        Start in 3 minutes <span aria-hidden="true">→</span>
      </MarketingButton>
    );
  }

  // Keep the CTA readable while /me resolves. If it is clicked before
  // resolution, it stays on the homepage instead of showing a blank slot.
  if (session && openHref === null) {
    return (
      <MarketingButton href="/" className={`${CTA_MIN} opacity-90`} ctaTarget="home_open_pending">
        Open Raltic <span aria-hidden="true">→</span>
      </MarketingButton>
    );
  }

  if (session && openHref) {
    return (
      <MarketingButton href={openHref} className={CTA_MIN} ctaTarget="home_open_workspace">
        Open Raltic <span aria-hidden="true">→</span>
      </MarketingButton>
    );
  }

  // Primary CTA names the first-value path after signup. Runtime choice
  // is deliberately deferred until the user asks for private local work.
  return (
    <MarketingButton href="/signup" className={CTA_MIN} ctaTarget="home_first_value">
      Start in 3 minutes <span aria-hidden="true">→</span>
    </MarketingButton>
  );
}
