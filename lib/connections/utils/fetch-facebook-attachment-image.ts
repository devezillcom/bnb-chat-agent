import { APIError } from "@/lib/exposers/api-error";
import { normalizeContentType } from "@/lib/r2/utils/normalize-content-type";

export type FetchFacebookAttachmentImageParams = {
  url: string;
  pageAccessToken: string;
};

export type FetchFacebookAttachmentImageResult = {
  body: Buffer;
  contentType: string;
};

async function fetchImageResponse(url: string): Promise<Response> {
  return fetch(url, { cache: "no-store" });
}

export async function fetchFacebookAttachmentImage(
  params: FetchFacebookAttachmentImageParams,
): Promise<FetchFacebookAttachmentImageResult> {
  let response = await fetchImageResponse(params.url);

  if (!response.ok) {
    const authenticatedUrl = new URL(params.url);
    authenticatedUrl.searchParams.set("access_token", params.pageAccessToken);
    response = await fetchImageResponse(authenticatedUrl.toString());
  }

  if (!response.ok) {
    throw new APIError(
      "ERR_FACEBOOK_IMAGE_FETCH_FAILED",
      `Could not download Facebook image (${response.status}).`,
      400,
    );
  }

  const contentType = normalizeContentType(
    response.headers.get("content-type") ?? "image/jpeg",
  );

  if (!contentType.startsWith("image/")) {
    throw new APIError(
      "ERR_FACEBOOK_IMAGE_UNSUPPORTED",
      "Facebook attachment is not an image.",
      400,
    );
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
}
