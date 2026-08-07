import { FACEBOOK_GRAPH_BASE } from "../constants";
import type { FacebookPendingPage } from "../types";

type FacebookAccountsResponse = {
  data?: Array<{
    id: string;
    name: string;
    access_token: string;
    link?: string;
    picture?: {
      data?: {
        url?: string;
      };
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function fetchFacebookPages(userAccessToken: string) {
  const url =
    `${FACEBOOK_GRAPH_BASE}/me/accounts` +
    `?fields=id,name,access_token,link,picture` +
    `&access_token=${encodeURIComponent(userAccessToken)}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as FacebookAccountsResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Unable to load Facebook pages.");
  }

  const pages: FacebookPendingPage[] = (data.data ?? []).map((page) => ({
    id: page.id,
    name: page.name,
    accessToken: page.access_token,
    pageUrl: page.link ?? null,
    pictureUrl: page.picture?.data?.url ?? null,
  }));

  return pages;
}
