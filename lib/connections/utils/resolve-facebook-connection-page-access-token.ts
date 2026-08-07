import { APIError } from "@/lib/exposers/api-error";

import type { FacebookConnectionAuthData } from "../types";
import { getExternalId } from "./connection-display-utils";
import { decryptConnectionAuthData } from "./encrypt-connection-auth-data";
import { resolveFacebookConnectionPage } from "./resolve-facebook-connection-page";

export async function resolveFacebookConnectionPageAccessToken(params: {
  metadata: Record<string, unknown> | null;
  encryptedAuthData: string;
}): Promise<{ pageId: string; pageAccessToken: string }> {
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
  const { auth: resolvedAuth } = await resolveFacebookConnectionPage({
    pageId,
    auth,
  });

  return {
    pageId,
    pageAccessToken: resolvedAuth.access_token,
  };
}
