import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { and, eq } from "drizzle-orm";

import type { ConnectionMutationResult, DeleteConnectionParams } from "../types";
import { deleteConnectionSchedule } from "./sync-connection-schedule";

export async function deleteConnection(
  params: DeleteConnectionParams,
): Promise<ConnectionMutationResult> {
  const [connection] = await db
    .delete(connections)
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

  await deleteConnectionSchedule(connection.id);

  return {
    id: connection.id,
    message: "Connection deleted.",
  };
}
