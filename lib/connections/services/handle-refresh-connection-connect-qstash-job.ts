import { eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import type { QstashJobHandlerContext } from "@/lib/qstash/job-config";

import { refreshConnectionConnectQstashPayloadSchema } from "../schema";
import { getErrorMessage } from "../utils/connection-display-utils";
import { performFacebookConnectionConnectRefresh } from "./perform-facebook-connection-connect-refresh";
import { recordConnectionConnectFailure } from "./record-connection-connect-failure";

export async function handleRefreshConnectionConnectQstashJob(
  payload: unknown,
  _context: QstashJobHandlerContext,
): Promise<void> {
  const { connectionId } =
    refreshConnectionConnectQstashPayloadSchema.parse(payload);

  const [row] = await db
    .select({
      workspaceId: connections.workspaceId,
      channelType: connections.channelType,
      metadata: connections.metadata,
      encryptedAuthData: connections.encryptedAuthData,
      lastError: connections.lastError,
    })
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1);

  if (
    !row ||
    row.channelType !== "facebook" ||
    row.lastError !== null
  ) {
    return;
  }

  try {
    await performFacebookConnectionConnectRefresh({
      workspaceId: row.workspaceId,
      connectionId,
      metadata: row.metadata,
      encryptedAuthData: row.encryptedAuthData,
    });
  } catch (error) {
    console.error("[refresh-connection-connect] Scheduled refresh failed", {
      connectionId,
      error,
    });

    await recordConnectionConnectFailure({
      workspaceId: row.workspaceId,
      connectionId,
      errorMessage: getErrorMessage(error),
    });
  }
}
