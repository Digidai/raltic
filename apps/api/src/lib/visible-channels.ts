import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Subject } from "@raltic/auth-core";
import { agents, channelMembers, channels, serverMembers } from "@raltic/db";

type DB = ReturnType<typeof drizzle>;

export async function listVisibleChannelIds(
  db: DB,
  subject: Subject,
  opts: {
    serverId?: string;
    includeArchived?: boolean;
    includePublic?: boolean;
    types?: Array<"public" | "private" | "dm">;
  } = {},
): Promise<string[]> {
  const scopedServerId = subject.kind === "user" ? opts.serverId : subject.serverId;
  const ids = new Set<string>();
  const typeFilter = opts.types?.length ? inArray(channels.type, opts.types) : undefined;
  const archivedFilter = opts.includeArchived ? undefined : isNull(channels.archivedAt);

  if (subject.kind === "bridge") {
    if (subject.agentIds.length === 0) return [];
    const rows = await db
      .select({ id: channelMembers.channelId })
      .from(channelMembers)
      .innerJoin(channels, eq(channels.id, channelMembers.channelId))
      .where(and(
        eq(channelMembers.memberType, "agent"),
        inArray(channelMembers.memberId, subject.agentIds),
        scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
        typeFilter,
        archivedFilter,
      ));
    for (const row of rows) ids.add(row.id);
    return [...ids];
  }

  const humanRows = await db
    .select({ id: channelMembers.channelId })
    .from(channelMembers)
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(and(
      eq(channelMembers.memberId, subject.userId),
      eq(channelMembers.memberType, "human"),
      scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
      typeFilter,
      archivedFilter,
    ));
  for (const row of humanRows) ids.add(row.id);

  const ownedAgentRows = await db
    .select({ id: channelMembers.channelId })
    .from(channelMembers)
    .innerJoin(agents, eq(agents.id, channelMembers.memberId))
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(and(
      eq(channelMembers.memberType, "agent"),
      eq(agents.ownerId, subject.userId),
      scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
      typeFilter,
      archivedFilter,
    ));
  for (const row of ownedAgentRows) ids.add(row.id);

  if (opts.includePublic !== false) {
    const publicRows = await db
      .select({ id: channels.id })
      .from(channels)
      .innerJoin(serverMembers, eq(serverMembers.serverId, channels.serverId))
      .where(and(
        eq(channels.type, "public"),
        eq(serverMembers.memberId, subject.userId),
        eq(serverMembers.memberType, "human"),
        scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
        typeFilter,
        archivedFilter,
      ));
    for (const row of publicRows) ids.add(row.id);
  }

  return [...ids];
}
