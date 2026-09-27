import { randomBytes } from "node:crypto";

import type { WebsiteConnectionMetadata } from "../types";
import { normalizeWebsiteUrl } from "./normalize-website-url";

export function createWebsitePublicKey() {
  return randomBytes(24).toString("base64url");
}

export function buildWebsiteConnectionMetadata(params: {
  websiteUrl: string;
  publicKey?: string;
}): WebsiteConnectionMetadata {
  const normalized = normalizeWebsiteUrl(params.websiteUrl);

  return {
    website_url: normalized.websiteUrl,
    allowed_origin: normalized.allowedOrigin,
    public_key: params.publicKey ?? createWebsitePublicKey(),
  };
}
