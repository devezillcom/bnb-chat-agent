import { FACEBOOK_GRAPH_BASE } from "../constants";
import {
  getFacebookAppId,
  getFacebookAppSecret,
  getFacebookOAuthRedirectUri,
} from "./get-facebook-config";

type FacebookTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

async function fetchFacebookToken(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as FacebookTokenResponse & {
    error?: { message?: string };
  };

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error?.message ?? "Unable to exchange Facebook token.",
    );
  }

  return data;
}

export async function exchangeFacebookCodeForToken(code: string) {
  const appId = getFacebookAppId();
  const appSecret = getFacebookAppSecret();
  const redirectUri = encodeURIComponent(getFacebookOAuthRedirectUri());
  const url =
    `${FACEBOOK_GRAPH_BASE}/oauth/access_token` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${redirectUri}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&code=${encodeURIComponent(code)}`;

  return fetchFacebookToken(url);
}

export async function exchangeFacebookShortLivedToken(shortLivedToken: string) {
  const appId = getFacebookAppId();
  const appSecret = getFacebookAppSecret();
  const url =
    `${FACEBOOK_GRAPH_BASE}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(appId)}` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&fb_exchange_token=${encodeURIComponent(shortLivedToken)}`;

  return fetchFacebookToken(url);
}

export function getFacebookTokenExpiresAt(expiresIn?: number) {
  const seconds = expiresIn && expiresIn > 0 ? expiresIn : 60 * 24 * 60 * 60;
  return new Date(Date.now() + seconds * 1000).toISOString();
}
