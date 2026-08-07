import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { and, eq } from "drizzle-orm";

import type { ConnectionMutationResult, DeleteConnectionParams } from "../types";
import { cleanupFacebookConnectionOnDelete } from "./cleanup-facebook-connection-on-delete";
import { deleteConnectionSchedule } from "./sync-connection-schedule";

export async function deleteConnection(
  params: DeleteConnectionParams,
): Promise<ConnectionMutationResult> {
  const [connection] = await db
    .select({
      id: connections.id,
      channelType: connections.channelType,
      metadata: connections.metadata,
      encryptedAuthData: connections.encryptedAuthData,
    })
    .from(connections)
    .where(
      and(
        eq(connections.id, params.id),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!connection) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  if (connection.channelType === "facebook") {
    await cleanupFacebookConnectionOnDelete({
      metadata: connection.metadata,
      encryptedAuthData: connection.encryptedAuthData,
    });
  }

  await db
    .delete(connections)
    .where(
      and(
        eq(connections.id, params.id),
        eq(connections.workspaceId, params.workspaceId),
      ),
    );

  await deleteConnectionSchedule(connection.id);

  return {
    id: connection.id,
    message: "Connection deleted.",
  };
}
