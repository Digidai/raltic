import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@raltic/auth-core";
import { NextResponse } from "next/server";
import {
  UTM_KEYS,
  isFunnelEvent,
  isTrackingId,
  type FunnelUtm,
} from "@/lib/funnel-analytics";

const MAX_BODY = 4096;
const MAX_UTM_VALUE_LEN = 64;
const MAX_EVENTS_PER_MINUTE = 120;
const EVENT_TIME_DRIFT_MS = 7 * 24 * 60 * 60 * 1000;
const AUTOMATION_USER_AGENT_MARKERS = ["headlesschrome", "playwright"];

type AnalyticsEnv = {
  DB?: D1Database;
  RATE_LIMITS?: KVNamespace;
  BETTER_AUTH_SECRET?: string;
  WEB_ORIGIN?: string;
  [key: string]: unknown;
};

type ParsedEvent = {
  event: string;
  anonymousId: string;
  sessionId: string;
  journeyId: string;
  path: string;
  target: string | null;
  referrerHost: string | null;
  utm: FunnelUtm;
  occurredAt: number;
};

function isBodyTooLarge(req: Request): boolean {
  const contentLength = req.headers.get("content-length");
  if (!contentLength) return false;
  const size = Number(contentLength);
  return Number.isFinite(size) && size > MAX_BODY;
}

function isAutomatedRequest(req: Request): boolean {
  const userAgent = req.headers.get("user-agent")?.toLowerCase() ?? "";
  return AUTOMATION_USER_AGENT_MARKERS.some((marker) => userAgent.includes(marker));
}

function cleanPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
}

function cleanTarget(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 100);
}

function referrerHost(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    return new URL(value).hostname.slice(0, 200);
  } catch {
    return null;
  }
}

function cleanUtm(value: unknown): FunnelUtm {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const utm: FunnelUtm = {};
  for (const key of UTM_KEYS) {
    const candidate = source[key];
    if (typeof candidate === "string" && candidate.length > 0) {
      utm[key] = candidate.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, MAX_UTM_VALUE_LEN);
    }
  }
  return utm;
}

function parseCookie(req: Request, name: string): string | null {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;
  for (const part of cookies.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName !== name) continue;
    try {
      return decodeURIComponent(rawValue.join("="));
    } catch {
      return null;
    }
  }
  return null;
}

function utmFromCookie(req: Request): { utm: FunnelUtm; firstPath: string | null } {
  const raw = parseCookie(req, "ral_utm");
  if (!raw) return { utm: {}, firstPath: null };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      utm: cleanUtm(parsed),
      firstPath: cleanPath(parsed.p),
    };
  } catch {
    return { utm: {}, firstPath: null };
  }
}

function parseEvent(raw: string, req: Request): ParsedEvent | null {
  const body = JSON.parse(raw) as Record<string, unknown>;
  if (!isFunnelEvent(body.event)) return null;
  if (!isTrackingId(body.anonymousId) || !isTrackingId(body.sessionId) || !isTrackingId(body.journeyId)) {
    return null;
  }
  const path = cleanPath(body.path);
  if (!path) return null;

  const cookieAttribution = utmFromCookie(req);
  const bodyUtm = cleanUtm(body.utm);
  const utm = Object.keys(bodyUtm).length > 0 ? bodyUtm : cookieAttribution.utm;
  const now = Date.now();
  const requestedTime = typeof body.ts === "number" ? body.ts : now;
  const occurredAt = Math.abs(requestedTime - now) <= EVENT_TIME_DRIFT_MS ? requestedTime : now;

  return {
    event: body.event,
    anonymousId: body.anonymousId,
    sessionId: body.sessionId,
    journeyId: body.journeyId,
    path,
    target: cleanTarget(body.target),
    referrerHost: referrerHost(body.referrer),
    utm,
    occurredAt,
  };
}

async function rateLimit(req: Request, env: AnalyticsEnv): Promise<boolean> {
  if (!env.RATE_LIMITS) return false;
  const ip = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const minute = Math.floor(Date.now() / 60_000);
  const key = `rl:marketing-event:${ip}:${minute}`;
  try {
    const count = Number(await env.RATE_LIMITS.get(key) ?? "0");
    if (count >= MAX_EVENTS_PER_MINUTE) return true;
    await env.RATE_LIMITS.put(key, String(count + 1), { expirationTtl: 120 });
  } catch {
    // Analytics stays available during a KV incident; D1 still validates input.
  }
  return false;
}

async function authenticatedUserId(req: Request, env: AnalyticsEnv): Promise<string | null> {
  if (!req.headers.get("cookie") || !env.DB || !env.BETTER_AUTH_SECRET || !env.WEB_ORIGIN) return null;
  try {
    const auth = createAuth(env as never);
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user?.id ?? null;
  } catch (error) {
    console.warn("[marketing-event] session lookup failed", error);
    return null;
  }
}

async function persistEvent(
  req: Request,
  env: AnalyticsEnv,
  event: ParsedEvent,
): Promise<void> {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");

  const userId = await authenticatedUserId(req, env);
  const now = Date.now();
  const id = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`
      INSERT INTO marketing_events (
        id, event, anonymous_id, session_id, journey_id, user_id,
        path, target, referrer_host, utm_source, utm_medium,
        utm_campaign, utm_content, utm_term, occurred_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      event.event,
      event.anonymousId,
      event.sessionId,
      event.journeyId,
      userId,
      event.path,
      event.target,
      event.referrerHost,
      event.utm.utm_source ?? null,
      event.utm.utm_medium ?? null,
      event.utm.utm_campaign ?? null,
      event.utm.utm_content ?? null,
      event.utm.utm_term ?? null,
      event.occurredAt,
      now,
    ),
  ];

  if (userId) {
    statements.push(
      env.DB.prepare(`
        UPDATE marketing_events
        SET user_id = ?
        WHERE user_id IS NULL
          AND (journey_id = ? OR anonymous_id = ?)
          AND occurred_at >= ?
      `).bind(userId, event.journeyId, event.anonymousId, now - 30 * 24 * 60 * 60 * 1000),
      env.DB.prepare(`
        INSERT OR IGNORE INTO user_attributions (
          user_id, journey_id, anonymous_id, first_path,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          created_at, updated_at
        )
        SELECT
          ?, first_event.journey_id, first_event.anonymous_id, first_event.path,
          first_event.utm_source, first_event.utm_medium, first_event.utm_campaign,
          first_event.utm_content, first_event.utm_term, ?, ?
        FROM (
          SELECT
            journey_id, anonymous_id, path, utm_source, utm_medium,
            utm_campaign, utm_content, utm_term
          FROM marketing_events
          WHERE (journey_id = ? OR anonymous_id = ?)
            AND occurred_at >= ?
          ORDER BY occurred_at ASC, created_at ASC
          LIMIT 1
        ) AS first_event
      `).bind(
        userId,
        now,
        now,
        event.journeyId,
        event.anonymousId,
        now - 30 * 24 * 60 * 60 * 1000,
      ),
    );
  }

  await env.DB.batch(statements);
}

export async function POST(req: Request): Promise<Response> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return new NextResponse(null, { status: 415 });
  if (isBodyTooLarge(req)) return new NextResponse(null, { status: 413 });

  let event: ParsedEvent | null = null;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 });
    event = parseEvent(raw, req);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!event) return new NextResponse(null, { status: 400 });
  if (isAutomatedRequest(req)) return new NextResponse(null, { status: 204 });

  let env: AnalyticsEnv;
  try {
    env = getCloudflareContext().env as AnalyticsEnv;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.info("[marketing-event] development fallback", event);
      return new NextResponse(null, { status: 204 });
    }
    console.error("[marketing-event] Cloudflare context unavailable", error);
    return new NextResponse(null, { status: 503 });
  }

  if (!env.DB && process.env.NODE_ENV === "development") {
    console.info("[marketing-event] development fallback", event);
    return new NextResponse(null, { status: 204 });
  }

  if (await rateLimit(req, env)) return new NextResponse(null, { status: 429 });

  try {
    await persistEvent(req, env, event);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.info("[marketing-event] development persistence fallback", event);
      return new NextResponse(null, { status: 204 });
    }
    console.error("[marketing-event] D1 persistence failed", error);
    return new NextResponse(null, { status: 503 });
  }

  return new NextResponse(null, { status: 204 });
}
