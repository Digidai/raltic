"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import {
  clearStoredOnboardingIntent,
  readOnboardingIntentFromSearch,
  readStoredOnboardingIntent,
  workspaceEntryForIntent,
} from "@/lib/onboarding-intent";
import {
  addWorkflowStarterIntentToPath,
  readStoredWorkflowStarterIntent,
  readWorkflowStarterIntentFromSearch,
} from "@/lib/workflow-intent";

/**
 * Mounted at the top of the marketing landing (`/`). For signed-in users,
 * resolves `defaultServerSlug` via /me and redirects them into the app
 * (no marketing page flash beyond the time it takes /me to round-trip).
 *
 * Signed-out users: no-op, marketing renders normally.
 *
 * Why client-only + location.replace:
 *   • Doing this on the server would require reading better-auth's
 *     session cookie + an extra API hop in the SSR render — adds
 *     latency to every public visit even for signed-out users.
 *   • `useSession()` only fires the API call when the cookie is present,
 *     so the signed-out path stays free.
 *   • A full-document replace prevents marketing-only analytics from
 *     surviving a client transition into the authenticated workspace.
 *   • `replace` (not assign) keeps the back button from trapping the user on /.
 *
 * Fallback chain matches /me's resolver: defaultServerSlug →
 * personalServerSlug → first server in the list. If none resolves
 * (zero memberships), we let the user stay on `/` and click "Get
 * started" — they probably need to finish a stuck signup.
 */
export function SignedInRedirect(): null {
  const { data: session, isPending } = useSession();
  // One-shot guard: useSession is reactive but redirect should fire once
  // per landing. Without this, an HMR refresh that re-fires the effect
  // would race router.replace against itself.
  const fired = useRef(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) return;
    if (fired.current) return;
    fired.current = true;

    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        const queryIntent = typeof window !== "undefined"
          ? readOnboardingIntentFromSearch(new URLSearchParams(window.location.search))
          : null;
        const intent = queryIntent ?? readStoredOnboardingIntent();
        const search = new URLSearchParams(window.location.search);
        const workflowIntent = readWorkflowStarterIntentFromSearch(search)
          ?? readStoredWorkflowStarterIntent();
        const baseTarget = workspaceEntryForIntent({
          intent,
          defaultSlug: me.defaultServerSlug,
          personalSlug: me.personalServerSlug,
          fallbackSlug: me.servers[0]?.slug,
        });
        const target = baseTarget
          ? addWorkflowStarterIntentToPath(baseTarget, workflowIntent)
          : null;
        if (target) {
          clearStoredOnboardingIntent();
          window.location.replace(target);
        }
        // No workspace at all — leave the user on marketing. They'll
        // see Get Started CTA. Genuinely shouldn't happen post-onboarding.
      } catch {
        // /me failed (session expired between cookie check and call):
        // fall back to staying on marketing. The user can click Sign in.
      }
    })();

    return () => { cancelled = true; };
  }, [isPending, session?.user]);

  return null;
}
