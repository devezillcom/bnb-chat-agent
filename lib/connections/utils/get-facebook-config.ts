import { APIError } from "@/lib/exposers/api-error";

export function getFacebookAppId() {
  const appId = process.env.FACEBOOK_APP_ID?.trim();

  if (!appId) {
    throw new APIError(
      "ERR_FACEBOOK_NOT_CONFIGURED",
      "Facebook integration is not configured.",
      500,
    );
  }

  return appId;
}

export function getFacebookAppSecret() {
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();

  if (!appSecret) {
    throw new APIError(
      "ERR_FACEBOOK_NOT_CONFIGURED",
      "Facebook integration is not configured.",
      500,
    );
  }

  return appSecret;
}

export function getFacebookWebhookVerifyToken() {
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN?.trim();

  if (!verifyToken) {
    throw new APIError(
      "ERR_FACEBOOK_NOT_CONFIGURED",
      "FACEBOOK_WEBHOOK_VERIFY_TOKEN must be set for Messenger webhooks.",
      500,
    );
  }

  return verifyToken;
}

export function getFacebookOAuthRedirectUri() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    throw new APIError(
      "ERR_APP_URL_NOT_CONFIGURED",
      "NEXT_PUBLIC_APP_URL must be set for Facebook OAuth.",
      500,
    );
  }

  return `${appUrl}/api/connections/connect/facebook/callback`;
}
