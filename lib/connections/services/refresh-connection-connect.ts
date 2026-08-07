import { and, eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  ConnectionMutationResult,
  RefreshConnectionConnectParams,
} from "../types";
import { getErrorMessage } from "../utils/connection-display-utils";
import { performFacebookConnectionConnectRefresh } from "./perform-facebook-connection-connect-refresh";
import { recordConnectionConnectFailure } from "./record-connection-connect-failure";
import { syncConnectionSchedule } from "./sync-connection-schedule";

export async function refreshConnectionConnect(
  params: RefreshConnectionConnectParams,
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
    );

  if (!connection) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  if (connection.channelType !== "facebook") {
    throw new APIError(
      "ERR_CONNECTION_UNSUPPORTED",
      "Refresh is not supported for this connection type.",
      400,
    );
  }

  try {
    const refreshed = await performFacebookConnectionConnectRefresh({
      workspaceId: params.workspaceId,
      connectionId: connection.id,
      metadata: connection.metadata,
      encryptedAuthData: connection.encryptedAuthData,
    });
    await syncConnectionSchedule({
      workspaceId: params.workspaceId,
      userId: params.userId,
      connectionId: connection.id,
    });

    return {
      id: refreshed.id,
      message: "Connection refreshed.",
    };
  } catch (error) {
    await recordConnectionConnectFailure({
      workspaceId: params.workspaceId,
      connectionId: connection.id,
      errorMessage: getErrorMessage(error),
    });
    throw error;
  }
}
