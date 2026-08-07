import type { FacebookConnectionAuthData } from "../types";
import { decryptConnectionAuthData } from "../utils/encrypt-connection-auth-data";
import { resolveFacebookConnectionPage } from "../utils/resolve-facebook-connection-page";

export async function resolveFacebookInboundPageAccessToken(params: {
  metadata: Record<string, unknown> | null;
  encryptedAuthData: string;
}): Promise<string> {
  const pageId =
    typeof params.metadata?.external_id === "string"
      ? params.metadata.external_id
      : null;

  if (!pageId) {
    throw new Error("Facebook connection is missing page id metadata.");
  }

  const auth = decryptConnectionAuthData<FacebookConnectionAuthData>(
    params.encryptedAuthData,
  );

  const { auth: resolvedAuth } = await resolveFacebookConnectionPage({
    pageId,
    auth,
  });

  return resolvedAuth.access_token;
}
