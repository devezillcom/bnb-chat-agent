import type {
  ConnectionMutationResult,
  FacebookConnectionWebhookMutationParams,
} from "../types";
import {
  subscribeFacebookPageWebhook,
} from "../utils/facebook-page-webhook-subscription";
import { getFacebookConnectionPageAccessToken } from "./get-facebook-connection-page-access-token";

export async function subscribeFacebookConnectionWebhook(
  params: FacebookConnectionWebhookMutationParams,
): Promise<ConnectionMutationResult> {
  const { pageId, pageAccessToken } = await getFacebookConnectionPageAccessToken(
    params,
  );

  await subscribeFacebookPageWebhook({
    pageId,
    pageAccessToken,
  });

  return {
    id: params.connectionId,
    message: "Facebook webhook subscribed.",
  };
}
