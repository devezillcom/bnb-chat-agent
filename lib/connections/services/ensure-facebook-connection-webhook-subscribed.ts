import { FACEBOOK_WEBHOOK_SUBSCRIBED_FIELDS } from "../constants";
import type { FacebookConnectionWebhookMutationParams } from "../types";
import {
  getFacebookPageWebhookSubscriptionStatus,
  subscribeFacebookPageWebhook,
} from "../utils/facebook-page-webhook-subscription";
import { getFacebookConnectionPageAccessToken } from "./get-facebook-connection-page-access-token";

export async function ensureFacebookConnectionWebhookSubscribed(
  params: FacebookConnectionWebhookMutationParams,
): Promise<{ subscribedNow: boolean }> {
  const { pageId, pageAccessToken } =
    await getFacebookConnectionPageAccessToken(params);

  const status = await getFacebookPageWebhookSubscriptionStatus({
    pageId,
    pageAccessToken,
  });

  const hasRequiredFields = FACEBOOK_WEBHOOK_SUBSCRIBED_FIELDS.every((field) =>
    status.subscribedFields.includes(field),
  );

  if (status.subscribed && hasRequiredFields) {
    return { subscribedNow: false };
  }

  await subscribeFacebookPageWebhook({
    pageId,
    pageAccessToken,
  });

  return { subscribedNow: true };
}
