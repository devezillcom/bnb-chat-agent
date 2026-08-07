import { readFacebookPendingOAuthData } from "../utils/facebook-oauth-cookie";
import { fetchFacebookPages } from "../utils/fetch-facebook-pages";
import type { FacebookPageOption } from "../types";

export async function listFacebookPagesForPendingOAuth(
  userId: string,
): Promise<FacebookPageOption[]> {
  const pending = await readFacebookPendingOAuthData(userId);
  const pages = await fetchFacebookPages(pending.userAccessToken);

  return pages.map((page) => ({
    id: page.id,
    name: page.name,
    pictureUrl: page.pictureUrl,
    pageUrl: page.pageUrl,
  }));
}
