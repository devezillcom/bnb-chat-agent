import type {
  FacebookConnectionWebhookStatusParams,
  FacebookConnectionWebhookStatusResult,
} from "../types";
import { getFacebookPageWebhookSubscriptionStatus } from "../utils/facebook-page-webhook-subscription";
import { getFacebookConnectionPageAccessToken } from "./get-facebook-connection-page-access-token";

export async function getFacebookConnectionWebhookStatus(
  params: FacebookConnectionWebhookStatusParams,
): Promise<FacebookConnectionWebhookStatusResult> {
  const { pageId, pageAccessToken } = await getFacebookConnectionPageAccessToken(
    params,
  );

  return getFacebookPageWebhookSubscriptionStatus({
    pageId,
    pageAccessToken,
  });
}
