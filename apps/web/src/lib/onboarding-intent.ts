export const CONNECT_RUNTIME_INTENT = "connect-runtime";
export const CONNECT_RUNTIME_SIGNUP_HREF = `/signup?intent=${CONNECT_RUNTIME_INTENT}`;

const STORAGE_KEY = "raltic:onboarding:intent";

export type OnboardingIntent = typeof CONNECT_RUNTIME_INTENT;

type SearchReader = Pick<URLSearchParams, "get">;

export function readOnboardingIntentFromSearch(search: SearchReader): OnboardingIntent | null {
  const intent = search.get("intent");
  if (intent === CONNECT_RUNTIME_INTENT) return CONNECT_RUNTIME_INTENT;

  // Back-compat for links that shipped before the intent param was named.
  if (search.get("wizard") === "1") return CONNECT_RUNTIME_INTENT;

  return null;
}

export function addOnboardingIntentToPath(path: string, intent: OnboardingIntent | null): string {
  if (!intent) return path;
  try {
    const url = new URL(path, "https://raltic.local");
    url.searchParams.set("intent", intent);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path;
  }
}

export function allowsOnboardingIntent(path: string): boolean {
  try {
    const url = new URL(path, "https://raltic.local");
    return !url.pathname.startsWith("/desktop") && !url.pathname.startsWith("/invite");
  } catch {
    return true;
  }
}

export function readAllowedOnboardingIntent(search: SearchReader, nextPath: string): OnboardingIntent | null {
  const intent = readOnboardingIntentFromSearch(search);
  return intent && allowsOnboardingIntent(nextPath) ? intent : null;
}

export function buildAuthPath(pathname: string, params: Record<string, string | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function persistOnboardingIntent(intent: OnboardingIntent | null): void {
  if (!intent || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, intent);
  } catch {
    // Private browsing / blocked storage degrades to URL-only handoff.
  }
}

export function readStoredOnboardingIntent(): OnboardingIntent | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === CONNECT_RUNTIME_INTENT
      ? CONNECT_RUNTIME_INTENT
      : null;
  } catch {
    return null;
  }
}

export function clearStoredOnboardingIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function workspaceEntryForIntent(params: {
  intent: OnboardingIntent | null;
  defaultSlug: string | null | undefined;
  personalSlug: string | null | undefined;
  fallbackSlug: string | null | undefined;
}): string | null {
  if (params.intent === CONNECT_RUNTIME_INTENT) {
    const slug = params.personalSlug ?? params.defaultSlug ?? params.fallbackSlug ?? null;
    return slug ? `/s/${slug}?wizard=1` : null;
  }

  const slug = params.defaultSlug ?? params.personalSlug ?? params.fallbackSlug ?? null;
  return slug ? `/s/${slug}` : null;
}
