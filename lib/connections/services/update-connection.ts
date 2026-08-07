import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { and, eq } from "drizzle-orm";

import type { ConnectionMutationResult, UpdateConnectionParams } from "../types";

export async function updateConnection(
  params: UpdateConnectionParams,
): Promise<ConnectionMutationResult> {
  if (params.name === undefined && params.agentId === undefined) {
    throw new APIError(
      "ERR_CONNECTION_NOTHING_TO_UPDATE",
      "No fields to update.",
      400,
    );
  }

  if (params.agentId) {
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
  }

  const updates: {
    name?: string;
    agentId?: string | null;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (params.name !== undefined) {
    updates.name = params.name;
  }

  if (params.agentId !== undefined) {
    updates.agentId = params.agentId;
  }

  const [connection] = await db
    .update(connections)
    .set(updates)
    .where(
      and(
        eq(connections.id, params.id),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: connections.id });

  if (!connection) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  return {
    id: connection.id,
    message: "Connection updated.",
  };
}
