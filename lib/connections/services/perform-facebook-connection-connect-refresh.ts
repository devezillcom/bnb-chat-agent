import { and, eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { FacebookConnectionAuthData } from "../types";
import { buildFacebookConnectionMetadata } from "../utils/build-facebook-connection-metadata";
import { getExternalId } from "../utils/connection-display-utils";
import { decryptConnectionAuthData, encryptConnectionAuthData } from "../utils/encrypt-connection-auth-data";
import { resolveFacebookConnectionPage } from "../utils/resolve-facebook-connection-page";

export async function performFacebookConnectionConnectRefresh(params: {
  workspaceId: string;
  connectionId: string;
  metadata: Record<string, unknown> | null;
  encryptedAuthData: string;
}): Promise<{ id: string; name: string }> {
  const pageId = getExternalId(params.metadata);
  if (!pageId) {
    throw new APIError(
      "ERR_CONNECTION_INVALID",
      "Facebook page ID is missing from connection metadata.",
      400,
    );
  }

  const auth = decryptConnectionAuthData<FacebookConnectionAuthData>(
    params.encryptedAuthData,
  );
  const { page, auth: resolvedAuth } = await resolveFacebookConnectionPage({
    pageId,
    auth,
  });
  const metadata = buildFacebookConnectionMetadata({ page });

  const [connection] = await db
    .update(connections)
    .set({
      name: page.name,
      metadata,
      encryptedAuthData: encryptConnectionAuthData(resolvedAuth),
      lastError: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(connections.id, params.connectionId),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: connections.id, name: connections.name });

  if (!connection) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  return connection;
}
