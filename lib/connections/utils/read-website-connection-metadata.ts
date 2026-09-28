import type { WebsiteConnectionMetadata } from "../types";
import type { NormalizedWebsiteUrl } from "./normalize-website-url";

export function readWebsiteConnectionMetadata(
  metadata: Record<string, unknown> | null | undefined,
): WebsiteConnectionMetadata | null {
  if (!metadata) {
    return null;
  }

  const websiteUrl = metadata.website_url;
  const allowedOrigin = metadata.allowed_origin;

  if (
    typeof websiteUrl !== "string" ||
    typeof allowedOrigin !== "string" ||
    !websiteUrl.trim() ||
    !allowedOrigin.trim()
  ) {
    return null;
  }

  return {
    website_url: websiteUrl.trim(),
    allowed_origin: allowedOrigin.trim(),
  };
}

export function replaceWebsiteUrlInMetadata(params: {
  metadata: Record<string, unknown> | null | undefined;
  normalized: NormalizedWebsiteUrl;
}): WebsiteConnectionMetadata {
  const existing = readWebsiteConnectionMetadata(params.metadata);

  if (!existing) {
    throw new Error("This website chat is missing its site address.");
  }

  return {
    website_url: params.normalized.websiteUrl,
    allowed_origin: params.normalized.allowedOrigin,
  };
}
