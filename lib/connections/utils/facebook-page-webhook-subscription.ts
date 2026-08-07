import { FACEBOOK_GRAPH_BASE, FACEBOOK_WEBHOOK_SUBSCRIBED_FIELDS } from "../constants";
import { getFacebookAppId } from "./get-facebook-config";

type FacebookGraphErrorResponse = {
  error?: {
    message?: string;
  };
};

type FacebookSubscribedAppsResponse = FacebookGraphErrorResponse & {
  data?: Array<{
    id?: string;
    subscribed_fields?: string[];
  }>;
};

type FacebookWebhookMutationResponse = FacebookGraphErrorResponse & {
  success?: boolean;
};

function getSubscribedFieldsParam() {
  return FACEBOOK_WEBHOOK_SUBSCRIBED_FIELDS.join(",");
}

function getFacebookGraphErrorMessage(
  data: FacebookGraphErrorResponse | null,
  fallback: string,
) {
  return data?.error?.message ?? fallback;
}

async function parseFacebookGraphResponse<T extends FacebookGraphErrorResponse>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || data?.error) {
    throw new Error(getFacebookGraphErrorMessage(data, fallbackError));
  }

  return data ?? ({} as T);
}

export async function getFacebookPageWebhookSubscriptionStatus(params: {
  pageId: string;
  pageAccessToken: string;
}): Promise<{ subscribed: boolean; subscribedFields: string[] }> {
  const url = new URL(
    `${FACEBOOK_GRAPH_BASE}/${encodeURIComponent(params.pageId)}/subscribed_apps`,
  );
  url.searchParams.set("access_token", params.pageAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const data = await parseFacebookGraphResponse<FacebookSubscribedAppsResponse>(
    response,
    "Unable to load Facebook webhook subscription status.",
  );

  const appId = getFacebookAppId();
  const subscription = data.data?.find((entry) => entry.id === appId);

  return {
    subscribed: Boolean(subscription),
    subscribedFields: subscription?.subscribed_fields ?? [],
  };
}

export async function subscribeFacebookPageWebhook(params: {
  pageId: string;
  pageAccessToken: string;
}): Promise<void> {
  const url = new URL(
    `${FACEBOOK_GRAPH_BASE}/${encodeURIComponent(params.pageId)}/subscribed_apps`,
  );
  url.searchParams.set("access_token", params.pageAccessToken);
  url.searchParams.set("subscribed_fields", getSubscribedFieldsParam());

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
  });
  const data =
    await parseFacebookGraphResponse<FacebookWebhookMutationResponse>(
      response,
      "Unable to subscribe Facebook webhook.",
    );

  if (!data.success) {
    throw new Error("Facebook did not confirm webhook subscription.");
  }
}

export async function unsubscribeFacebookPageWebhook(params: {
  pageId: string;
  pageAccessToken: string;
}): Promise<void> {
  const url = new URL(
    `${FACEBOOK_GRAPH_BASE}/${encodeURIComponent(params.pageId)}/subscribed_apps`,
  );
  url.searchParams.set("access_token", params.pageAccessToken);

  const response = await fetch(url, {
    method: "DELETE",
    cache: "no-store",
  });
  const data =
    await parseFacebookGraphResponse<FacebookWebhookMutationResponse>(
      response,
      "Unable to unsubscribe Facebook webhook.",
    );

  if (!data.success) {
    throw new Error("Facebook did not confirm webhook unsubscription.");
  }
}
