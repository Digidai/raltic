export const CLARITY_PROJECT_ID = "y2pfdo3bxa";
export const CLARITY_FIRST_PARTY_COOKIES = ["_clck", "_clsk"] as const;

export const CLARITY_CONSENT_COOKIE = "ral_analytics_consent";
export const CLARITY_CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
export const OPEN_ANALYTICS_PREFERENCES_EVENT = "raltic:open-analytics-preferences";

export type AnalyticsConsent = "granted" | "denied";
