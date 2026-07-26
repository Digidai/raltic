import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "@raltic/db/schema";
import { runMarketingDataRetention } from "../src/scheduled";
import { db } from "./helpers";

describe("marketing data retention", () => {
  it("deletes old funnel events and scrubs old form network metadata", async () => {
    const now = new Date("2026-07-26T12:00:00.000Z");
    const oldDate = new Date("2025-12-01T12:00:00.000Z");
    const recentDate = new Date("2026-07-25T12:00:00.000Z");
    const oldEventId = crypto.randomUUID();
    const recentEventId = crypto.randomUUID();
    const waitlistId = crypto.randomUUID();
    const newsletterId = crypto.randomUUID();

    await db().insert(schema.marketingEvents).values([
      {
        id: oldEventId,
        event: "landing_view",
        anonymousId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        journeyId: crypto.randomUUID(),
        path: "/",
        occurredAt: oldDate,
        createdAt: oldDate,
      },
      {
        id: recentEventId,
        event: "workspace_opened",
        anonymousId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        journeyId: crypto.randomUUID(),
        path: "/s/test",
        occurredAt: recentDate,
        createdAt: recentDate,
      },
    ]);
    await db().insert(schema.waitlistSignups).values({
      id: waitlistId,
      email: `${waitlistId}@example.com`,
      name: "Retention Test",
      refererPath: "/teams",
      ip: "192.0.2.10",
      userAgent: "retention-test",
      status: "new",
      createdAt: oldDate,
      updatedAt: oldDate,
    });
    await db().insert(schema.newsletterSignups).values({
      id: newsletterId,
      email: `${newsletterId}@example.com`,
      page: "/indie",
      ip: "192.0.2.11",
      userAgent: "retention-test",
      createdAt: oldDate,
    });

    const result = await runMarketingDataRetention(env, { now });

    expect(result.deletedEvents).toBeGreaterThanOrEqual(1);
    expect(await db().select().from(schema.marketingEvents).where(eq(schema.marketingEvents.id, oldEventId))).toHaveLength(0);
    expect(await db().select().from(schema.marketingEvents).where(eq(schema.marketingEvents.id, recentEventId))).toHaveLength(1);
    const [waitlist] = await db().select().from(schema.waitlistSignups).where(eq(schema.waitlistSignups.id, waitlistId));
    const [newsletter] = await db().select().from(schema.newsletterSignups).where(eq(schema.newsletterSignups.id, newsletterId));
    expect(waitlist).toMatchObject({ ip: null, userAgent: null });
    expect(newsletter).toMatchObject({ ip: null, userAgent: null });
  });
});
