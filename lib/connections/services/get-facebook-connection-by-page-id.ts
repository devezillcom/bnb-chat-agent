import { and, eq, sql } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";

export async function getFacebookConnectionByPageId(pageId: string) {
  const [connection] = await db
    .select({
      id: connections.id,
      workspaceId: connections.workspaceId,
      userId: connections.userId,
      agentId: connections.agentId,
      encryptedAuthData: connections.encryptedAuthData,
      metadata: connections.metadata,
    })
    .from(connections)
    .where(
      and(
        eq(connections.channelType, "facebook"),
        sql`${connections.metadata}->>'external_id' = ${pageId}`,
      ),
    )
    .limit(1);

  return connection ?? null;
}
