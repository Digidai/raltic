"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/heroui-pro/button";
import {
  CLARITY_CONSENT_COOKIE,
  CLARITY_CONSENT_MAX_AGE_SECONDS,
  CLARITY_FIRST_PARTY_COOKIES,
  CLARITY_PROJECT_ID,
  OPEN_ANALYTICS_PREFERENCES_EVENT,
  type AnalyticsConsent,
} from "@/lib/clarity";

type ClarityQueue = ((...args: unknown[]) => void) & { q?: IArguments[] };

declare global {
  interface Window {
    clarity?: ClarityQueue;
  }
}

type ConsentState = AnalyticsConsent | "loading" | null;

const CLARITY_BOOTSTRAP = `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  c[a]("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");
`;

function readConsentCookie(): AnalyticsConsent | null {
  const prefix = `${CLARITY_CONSENT_COOKIE}=`;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);

  return value === "granted" || value === "denied" ? value : null;
}

function writeConsentCookie(value: AnalyticsConsent): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CLARITY_CONSENT_COOKIE}=${value}; path=/; max-age=${CLARITY_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function clearClarityCookies(): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domainSuffix = window.location.hostname === "raltic.com" || window.location.hostname.endsWith(".raltic.com")
    ? "; Domain=.raltic.com"
    : "";

  for (const name of CLARITY_FIRST_PARTY_COOKIES) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`;
    if (domainSuffix) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}${domainSuffix}`;
    }
  }
}

/**
 * Clarity runs only on the public marketing route group and only after an
 * explicit analytics opt-in. Ad storage is always denied. Authenticated and
 * auth-form routes live outside this layout and therefore never bootstrap it.
 */
export function MicrosoftClarity() {
  const [consent, setConsent] = useState<ConsentState>("loading");
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useEffect(() => {
    const storedConsent = readConsentCookie();
    setConsent(storedConsent);
    setPreferencesOpen(storedConsent === null);

    const openPreferences = () => setPreferencesOpen(true);
    window.addEventListener(OPEN_ANALYTICS_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_ANALYTICS_PREFERENCES_EVENT, openPreferences);
  }, []);

  const saveConsent = (nextConsent: AnalyticsConsent) => {
    writeConsentCookie(nextConsent);

    if (nextConsent === "denied") {
      const clarityWasLoaded = consent === "granted" || typeof window.clarity === "function";
      if (typeof window.clarity === "function") {
        window.clarity("consentv2", {
          ad_Storage: "denied",
          analytics_Storage: "denied",
        });
      }
      clearClarityCookies();

      if (!clarityWasLoaded) {
        setConsent(nextConsent);
        setPreferencesOpen(false);
        return;
      }

      // Removing a Next Script node cannot stop code that already executed.
      // Reloading the marketing page guarantees the denied preference starts
      // a document where the Clarity bootstrap is never rendered.
      window.location.reload();
      return;
    }

    setConsent(nextConsent);
    setPreferencesOpen(false);
  };

  return (
    <>
      {consent === "granted" ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {CLARITY_BOOTSTRAP}
        </Script>
      ) : null}

      {preferencesOpen && consent !== "loading" ? (
        <aside
          aria-labelledby="analytics-preferences-title"
          aria-live="polite"
          data-analytics-preferences
          data-clarity-mask="true"
          className="fixed inset-x-3 bottom-0 z-[80] mx-auto max-w-xl rounded-[8px] border border-black/[0.12] bg-white p-4 text-zinc-700 shadow-[0_18px_50px_-20px_rgba(24,24,27,0.45)] sm:inset-x-6 sm:max-w-4xl"
        >
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h2 id="analytics-preferences-title" className="text-sm font-semibold text-zinc-950">
                Analytics preferences
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-zinc-600 sm:leading-relaxed">
                Microsoft Clarity helps us improve public pages with heatmaps and session replays. Form fields stay masked, advertising storage stays off, and it never runs inside your workspace.{" "}
                <Link className="text-[#2563eb] underline underline-offset-4 hover:text-[#1d4ed8]" href="/privacy">
                  Privacy details.
                </Link>
              </p>
            </div>
            <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:flex-row-reverse">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-[6px] border border-black/[0.12] bg-white px-3 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                onClick={() => saveConsent("denied")}
              >
                Decline analytics
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-9 rounded-[6px] border border-zinc-950 bg-zinc-950 px-3 text-xs font-medium text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
                onClick={() => saveConsent("granted")}
              >
                Allow analytics
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}

export function AnalyticsPreferencesButton() {
  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto min-w-0 px-0 py-0 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]"
      onClick={() => window.dispatchEvent(new Event(OPEN_ANALYTICS_PREFERENCES_EVENT))}
    >
      Analytics settings
    </Button>
  );
}
