import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { and, eq } from "drizzle-orm";

import type { ConnectionDetail, GetConnectionParams } from "../types";
import { mapConnectionRow } from "../utils/map-connection-row";

export async function getConnection(
  params: GetConnectionParams,
): Promise<ConnectionDetail> {
  const [row] = await db
    .select({
      id: connections.id,
      channelType: connections.channelType,
      name: connections.name,
      metadata: connections.metadata,
      lastError: connections.lastError,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
      agentId: connections.agentId,
      agentName: agents.name,
    })
    .from(connections)
    .leftJoin(agents, eq(connections.agentId, agents.id))
    .where(
      and(
        eq(connections.id, params.id),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  return mapConnectionRow(row);
}
