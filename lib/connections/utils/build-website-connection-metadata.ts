import type { WebsiteConnectionMetadata } from "../types";
import { normalizeWebsiteOrigins } from "./normalize-website-origins";

export function buildWebsiteConnectionMetadata(params: {
  allowAllOrigins: boolean;
  allowedOrigins: string[];
}): WebsiteConnectionMetadata {
  if (params.allowAllOrigins) {
    return {
      allow_all_origins: true,
      allowed_origins: [],
    };
  }

  return {
    allow_all_origins: false,
    allowed_origins: normalizeWebsiteOrigins(params.allowedOrigins),
  };
}

export function mergeWebsiteOriginsIntoMetadata(params: {
  metadata: Record<string, unknown> | null | undefined;
  allowAllOrigins: boolean;
  allowedOrigins: string[];
}): Record<string, unknown> {
  const next: Record<string, unknown> = {
    ...(params.metadata ?? {}),
    ...buildWebsiteConnectionMetadata(params),
  };

  delete next.website_url;
  delete next.allowed_origin;
  delete next.public_key;

  return next;
}
