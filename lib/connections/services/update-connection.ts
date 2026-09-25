import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { and, eq } from "drizzle-orm";

import type { ConnectionMutationResult, UpdateConnectionParams } from "../types";
import { deleteConnectionConversations } from "./delete-connection-conversations";
import { ensureFacebookConnectionWebhookSubscribed } from "./ensure-facebook-connection-webhook-subscribed";

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

  const [existing] = await db
    .select({
      agentId: connections.agentId,
      channelType: connections.channelType,
    })
    .from(connections)
    .where(
      and(
        eq(connections.id, params.id),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  const agentIdChanging =
    params.agentId !== undefined && params.agentId !== existing.agentId;

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

  if (agentIdChanging) {
    await deleteConnectionConversations({ connectionId: connection.id });
  }

  let message = "Connection updated.";

  if (params.agentId && existing.channelType === "facebook") {
    try {
      const { subscribedNow } = await ensureFacebookConnectionWebhookSubscribed({
        connectionId: connection.id,
        workspaceId: params.workspaceId,
      });

      if (subscribedNow) {
        message = "Agent assigned. Messenger webhook subscribed.";
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      const detail =
        error instanceof Error ? error.message : "Unknown Facebook error.";

      throw new APIError(
        "ERR_FACEBOOK_WEBHOOK_SUBSCRIBE",
        `Agent assigned, but the Messenger webhook could not be subscribed. ${detail}`,
        502,
      );
    }
  }

  return {
    id: connection.id,
    message,
  };
}
