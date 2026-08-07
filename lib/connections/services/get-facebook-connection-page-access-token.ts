import { and, eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import { resolveFacebookConnectionPageAccessToken } from "../utils/resolve-facebook-connection-page-access-token";

export async function getFacebookConnectionPageAccessToken(params: {
  connectionId: string;
  workspaceId: string;
}): Promise<{ pageId: string; pageAccessToken: string }> {
  const [connection] = await db
    .select({
      channelType: connections.channelType,
      metadata: connections.metadata,
      encryptedAuthData: connections.encryptedAuthData,
    })
    .from(connections)
    .where(
      and(
        eq(connections.id, params.connectionId),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!connection) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  if (connection.channelType !== "facebook") {
    throw new APIError(
      "ERR_CONNECTION_UNSUPPORTED",
      "Webhook management is only supported for Facebook connections.",
      400,
    );
  }

  return resolveFacebookConnectionPageAccessToken({
    metadata: connection.metadata,
    encryptedAuthData: connection.encryptedAuthData,
  });
}
