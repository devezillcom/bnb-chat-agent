import { FACEBOOK_GRAPH_BASE } from "../constants";

export type FacebookPageDetails = {
  id: string;
  name: string;
  pageUrl: string | null;
  pictureUrl: string | null;
};

type FacebookPageResponse = {
  id?: string;
  name?: string;
  link?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  error?: {
    message?: string;
  };
};

export async function fetchFacebookPageById(params: {
  pageId: string;
  accessToken: string;
}): Promise<FacebookPageDetails> {
  const url =
    `${FACEBOOK_GRAPH_BASE}/${encodeURIComponent(params.pageId)}` +
    `?fields=id,name,link,picture` +
    `&access_token=${encodeURIComponent(params.accessToken)}`;

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as FacebookPageResponse;

  if (!response.ok || !data.id || !data.name) {
    throw new Error(data.error?.message ?? "Unable to load Facebook page.");
  }

  return {
    id: data.id,
    name: data.name,
    pageUrl: data.link ?? null,
    pictureUrl: data.picture?.data?.url ?? null,
  };
}
