export const FUNNEL_EVENTS = [
  "landing_view",
  "cta_click",
  "runtime_card_click",
  "signup_view",
  "signup_submitted",
  "signup_created",
  "email_verified",
  "workspace_opened",
  "wizard_start",
  "cloud_agent_start",
  "workflow_starter_match_selected",
  "workflow_starter_click",
  "workflow_starter_runtime_gate_opened",
  "workflow_room_created",
  "workflow_room_joined",
  "workflow_room_opened",
  "workflow_starter_draft_used",
  "workflow_starter_brief_sent",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type FunnelUtm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const FUNNEL_EVENT_SET = new Set<string>(FUNNEL_EVENTS);
const ANONYMOUS_ID_KEY = "raltic:analytics:anonymous-id";
const SESSION_ID_KEY = "raltic:analytics:session-id";
const JOURNEY_KEY = "raltic:analytics:journey";
const JOURNEY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type StoredJourney = {
  id: string;
  expiresAt: number;
};

type TrackOptions = {
  target?: string | null;
  utm?: FunnelUtm;
  journeyId?: string | null;
};

type AnalyticsWindow = Window & {
  __RALTIC_ANALYTICS_TEST__?: boolean;
};

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === "string" && FUNNEL_EVENT_SET.has(value);
}

export function isTrackingId(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function newTrackingId(): string {
  return crypto.randomUUID();
}

function getOrCreatePersistentId(key: string): string {
  try {
    const existing = window.localStorage.getItem(key);
    if (isTrackingId(existing)) return existing;
    const id = newTrackingId();
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    return newTrackingId();
  }
}

function getOrCreateSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (isTrackingId(existing)) return existing;
    const id = newTrackingId();
    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return newTrackingId();
  }
}

export function persistJourneyId(value: string | null | undefined): string {
  if (typeof window === "undefined") return "";
  const id = isTrackingId(value) ? value : newTrackingId();
  const payload: StoredJourney = {
    id,
    expiresAt: Date.now() + JOURNEY_TTL_MS,
  };
  try {
    window.localStorage.setItem(JOURNEY_KEY, JSON.stringify(payload));
  } catch {
    // Storage-blocked browsers still carry the returned id in auth URLs.
  }
  return id;
}

export function getOrCreateJourneyId(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(JOURNEY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredJourney>;
      if (isTrackingId(parsed.id) && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()) {
        return parsed.id;
      }
    }
  } catch {
    // Fall through to a fresh journey.
  }
  return persistJourneyId(null);
}

export function trackingJourneyFromSearch(search: Pick<URLSearchParams, "get">): string | null {
  const value = search.get("journey");
  return isTrackingId(value) ? value : null;
}

export function addTrackingJourneyToPath(path: string, journeyId: string | null): string {
  if (!isTrackingId(journeyId)) return path;
  try {
    const url = new URL(path, "https://raltic.local");
    url.searchParams.set("journey", journeyId);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path;
  }
}

export function trackFunnelEvent(event: FunnelEvent, options: TrackOptions = {}): void {
  if (typeof window === "undefined") return;
  if (navigator.webdriver && !(window as AnalyticsWindow).__RALTIC_ANALYTICS_TEST__) return;
  const journeyId = isTrackingId(options.journeyId)
    ? persistJourneyId(options.journeyId)
    : getOrCreateJourneyId();
  const body = JSON.stringify({
    event,
    anonymousId: getOrCreatePersistentId(ANONYMOUS_ID_KEY),
    sessionId: getOrCreateSessionId(),
    journeyId,
    path: window.location.pathname,
    target: options.target ?? undefined,
    referrer: document.referrer || null,
    utm: options.utm,
    ts: Date.now(),
  });

  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/marketing/event", blob)) return;
  } catch {
    // Fall through to fetch.
  }

  void fetch("/api/marketing/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
