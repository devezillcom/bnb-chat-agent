import { APIError } from "@/lib/exposers/api-error";

import { FACEBOOK_LONG_LIVED_TOKEN_REFRESH_WITHIN_MS } from "../constants";
import type { FacebookConnectionAuthData } from "../types";
import {
  exchangeFacebookShortLivedToken,
  getFacebookTokenExpiresAt,
} from "./exchange-facebook-token";
import {
  fetchFacebookPageById,
  type FacebookPageDetails,
} from "./fetch-facebook-page-by-id";
import { fetchFacebookPages } from "./fetch-facebook-pages";

function isLongLivedTokenExpiringSoon(expiresAt: string) {
  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return true;
  }

  return (
    expiresAtMs <= Date.now() + FACEBOOK_LONG_LIVED_TOKEN_REFRESH_WITHIN_MS
  );
}

async function exchangeLongLivedUserToken(
  auth: FacebookConnectionAuthData,
): Promise<FacebookConnectionAuthData> {
  try {
    const refreshed = await exchangeFacebookShortLivedToken(auth.refresh_token);

    return {
      ...auth,
      refresh_token: refreshed.access_token,
      expires_at: getFacebookTokenExpiresAt(refreshed.expires_in),
    };
  } catch {
    return auth;
  }
}

async function refreshLongLivedUserTokenIfExpiringSoon(
  auth: FacebookConnectionAuthData,
): Promise<FacebookConnectionAuthData> {
  if (!isLongLivedTokenExpiringSoon(auth.expires_at)) {
    return auth;
  }

  return exchangeLongLivedUserToken(auth);
}

async function resolvePageFromAccounts(params: {
  pageId: string;
  userAccessToken: string;
}): Promise<{ page: FacebookPageDetails; pageAccessToken: string } | null> {
  try {
    const pages = await fetchFacebookPages(params.userAccessToken);
    const match = pages.find((page) => page.id === params.pageId);

    if (!match) {
      return null;
    }

    return {
      page: {
        id: match.id,
        name: match.name,
        pageUrl: match.pageUrl,
        pictureUrl: match.pictureUrl,
      },
      pageAccessToken: match.accessToken,
    };
  } catch {
    return null;
  }
}

export async function resolveFacebookConnectionPage(params: {
  pageId: string;
  auth: FacebookConnectionAuthData;
}): Promise<{ page: FacebookPageDetails; auth: FacebookConnectionAuthData }> {
  const auth = await refreshLongLivedUserTokenIfExpiringSoon(params.auth);

  try {
    const page = await fetchFacebookPageById({
      pageId: params.pageId,
      accessToken: auth.access_token,
    });

    return {
      page,
      auth,
    };
  } catch {
    let resolvedAuth = auth;
    let resolved = await resolvePageFromAccounts({
      pageId: params.pageId,
      userAccessToken: resolvedAuth.refresh_token,
    });

    if (!resolved) {
      resolvedAuth = await exchangeLongLivedUserToken(resolvedAuth);
      resolved = await resolvePageFromAccounts({
        pageId: params.pageId,
        userAccessToken: resolvedAuth.refresh_token,
      });
    }

    if (!resolved) {
      throw new APIError(
        "ERR_FACEBOOK_CONNECT_EXPIRED",
        "Facebook connection expired. Please reconnect this page.",
        401,
      );
    }

    return {
      page: resolved.page,
      auth: {
        ...resolvedAuth,
        access_token: resolved.pageAccessToken,
      },
    };
  }
}
