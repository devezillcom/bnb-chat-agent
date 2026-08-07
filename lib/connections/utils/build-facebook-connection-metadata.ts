import type { FacebookConnectionMetadata } from "../types";
import type { FacebookPageDetails } from "./fetch-facebook-page-by-id";

export function buildFacebookConnectionMetadata(params: {
  page: FacebookPageDetails;
}): FacebookConnectionMetadata {
  return {
    external_id: params.page.id,
    page_url: params.page.pageUrl ?? undefined,
    avatar_url: params.page.pictureUrl ?? undefined,
  };
}
