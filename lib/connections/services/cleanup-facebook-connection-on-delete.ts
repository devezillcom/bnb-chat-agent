import { unsubscribeFacebookPageWebhook } from "../utils/facebook-page-webhook-subscription";
import { resolveFacebookConnectionPageAccessToken } from "../utils/resolve-facebook-connection-page-access-token";

export async function cleanupFacebookConnectionOnDelete(params: {
  metadata: Record<string, unknown> | null;
  encryptedAuthData: string;
}): Promise<void> {
  try {
    const { pageId, pageAccessToken } =
      await resolveFacebookConnectionPageAccessToken(params);

    await unsubscribeFacebookPageWebhook({
      pageId,
      pageAccessToken,
    });
  } catch (error) {
    console.error(
      "[delete-connection] Facebook webhook unsubscribe failed:",
      error,
    );
  }
}
