import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { and, eq } from "drizzle-orm";

import type {
  ListConnectionsForAgentParams,
  ListConnectionsForAgentResult,
} from "../types";
import { mapConnectionRow } from "../utils/map-connection-row";

export async function listConnectionsForAgent(
  params: ListConnectionsForAgentParams,
): Promise<ListConnectionsForAgentResult> {
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!agent) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  const rows = await db
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
    .where(eq(connections.agentId, params.agentId));

  return {
    items: rows.map((row) => mapConnectionRow(row)),
  };
}
