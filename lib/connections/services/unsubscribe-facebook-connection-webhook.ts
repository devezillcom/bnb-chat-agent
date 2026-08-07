import type {
  ConnectionMutationResult,
  FacebookConnectionWebhookMutationParams,
} from "../types";
import {
  unsubscribeFacebookPageWebhook,
} from "../utils/facebook-page-webhook-subscription";
import { getFacebookConnectionPageAccessToken } from "./get-facebook-connection-page-access-token";

export async function unsubscribeFacebookConnectionWebhook(
  params: FacebookConnectionWebhookMutationParams,
): Promise<ConnectionMutationResult> {
  const { pageId, pageAccessToken } = await getFacebookConnectionPageAccessToken(
    params,
  );

  await unsubscribeFacebookPageWebhook({
    pageId,
    pageAccessToken,
  });

  return {
    id: params.connectionId,
    message: "Facebook webhook unsubscribed.",
  };
}
