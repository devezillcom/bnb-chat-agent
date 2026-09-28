import type { WebsiteConnectionMetadata } from "../types";
import { normalizeWebsiteUrl } from "./normalize-website-url";

export function buildWebsiteConnectionMetadata(params: {
  websiteUrl: string;
}): WebsiteConnectionMetadata {
  const normalized = normalizeWebsiteUrl(params.websiteUrl);

  return {
    website_url: normalized.websiteUrl,
    allowed_origin: normalized.allowedOrigin,
  };
}
