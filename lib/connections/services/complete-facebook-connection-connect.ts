import { and, eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  CompleteFacebookConnectionConnectResult,
  FacebookConnectionAuthData,
} from "../types";
import { buildFacebookConnectionMetadata } from "../utils/build-facebook-connection-metadata";
import { getExternalId } from "../utils/connection-display-utils";
import {
  exchangeFacebookShortLivedToken,
  getFacebookTokenExpiresAt,
} from "../utils/exchange-facebook-token";
import { encryptConnectionAuthData } from "../utils/encrypt-connection-auth-data";
import { fetchFacebookPages } from "../utils/fetch-facebook-pages";
import { readFacebookPendingOAuthData } from "../utils/facebook-oauth-cookie";
import { syncConnectionSchedule } from "./sync-connection-schedule";

export async function completeFacebookConnectionConnect(params: {
  userId: string;
  pageIds: string[];
}): Promise<CompleteFacebookConnectionConnectResult> {
  const pending = await readFacebookPendingOAuthData(params.userId);

  const longLivedUserToken = await exchangeFacebookShortLivedToken(
    pending.userAccessToken,
  );
  const userTokenExpiresAt = getFacebookTokenExpiresAt(
    longLivedUserToken.expires_in,
  );
  const pages = await fetchFacebookPages(longLivedUserToken.access_token);
  const selectedPageIds = new Set(params.pageIds);
  const selectedPages = pages.filter((page) => selectedPageIds.has(page.id));

  if (selectedPages.length === 0) {
    throw new APIError(
      "ERR_FACEBOOK_PAGE_NOT_FOUND",
      "Selected Facebook pages were not found.",
      404,
    );
  }

  const existingConnections = await db
    .select({
      id: connections.id,
      metadata: connections.metadata,
    })
    .from(connections)
    .where(
      and(
        eq(connections.workspaceId, pending.workspaceId),
        eq(connections.channelType, "facebook"),
      ),
    );

  const connectedExternalIds = new Set(
    existingConnections
      .map((connection) => getExternalId(connection.metadata))
      .filter((value): value is string => Boolean(value)),
  );

  const connectionIds: string[] = [];
  let skippedCount = 0;

  for (const page of selectedPages) {
    if (connectedExternalIds.has(page.id)) {
      skippedCount += 1;
      continue;
    }

    const authData: FacebookConnectionAuthData = {
      access_token: page.accessToken,
      refresh_token: longLivedUserToken.access_token,
      expires_at: userTokenExpiresAt,
    };

    const metadata = buildFacebookConnectionMetadata({
      page: {
        id: page.id,
        name: page.name,
        pageUrl: page.pageUrl,
        pictureUrl: page.pictureUrl,
      },
    });

    const [connection] = await db
      .insert(connections)
      .values({
        workspaceId: pending.workspaceId,
        userId: params.userId,
        channelType: "facebook",
        name: page.name,
        encryptedAuthData: encryptConnectionAuthData(authData),
        metadata,
      })
      .returning({ id: connections.id });

    await syncConnectionSchedule({
      workspaceId: pending.workspaceId,
      userId: params.userId,
      connectionId: connection.id,
    });

    connectionIds.push(connection.id);
    connectedExternalIds.add(page.id);
  }

  if (connectionIds.length === 0) {
    throw new APIError(
      "ERR_CONNECTION_ALREADY_CONNECTED",
      "Selected Facebook pages are already connected.",
      409,
    );
  }

  const message =
    skippedCount > 0
      ? `Connected ${connectionIds.length} page(s). Skipped ${skippedCount} already connected.`
      : `Connected ${connectionIds.length} page(s).`;

  return {
    message,
    connectedCount: connectionIds.length,
    skippedCount,
    connectionIds,
  };
}
