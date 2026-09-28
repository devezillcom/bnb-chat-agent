import type { WebsiteConnectionMetadata } from "../types";
import { normalizeWebsiteOrigin } from "./normalize-website-origin";

function readLegacyWebsiteOrigin(
  metadata: Record<string, unknown>,
): WebsiteConnectionMetadata | null {
  const allowedOrigin = metadata.allowed_origin;

  if (typeof allowedOrigin !== "string" || !allowedOrigin.trim()) {
    return null;
  }

  try {
    return {
      allow_all_origins: false,
      allowed_origins: [normalizeWebsiteOrigin(allowedOrigin)],
    };
  } catch {
    return null;
  }
}

function readCurrentWebsiteOrigins(
  metadata: Record<string, unknown>,
): WebsiteConnectionMetadata | null {
  if (metadata.allow_all_origins === true) {
    return {
      allow_all_origins: true,
      allowed_origins: [],
    };
  }

  if (!Array.isArray(metadata.allowed_origins)) {
    return readLegacyWebsiteOrigin(metadata);
  }

  const allowedOrigins: string[] = [];

  for (const item of metadata.allowed_origins) {
    if (typeof item !== "string" || !item.trim()) {
      continue;
    }

    try {
      const origin = normalizeWebsiteOrigin(item);
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    } catch {
      return null;
    }
  }

  if (allowedOrigins.length === 0) {
    return readLegacyWebsiteOrigin(metadata);
  }

  return {
    allow_all_origins: false,
    allowed_origins: allowedOrigins,
  };
}

export function readWebsiteConnectionMetadata(
  metadata: Record<string, unknown> | null | undefined,
): WebsiteConnectionMetadata | null {
  if (!metadata) {
    return null;
  }

  if (
    typeof metadata.allow_all_origins === "boolean" ||
    Array.isArray(metadata.allowed_origins)
  ) {
    return readCurrentWebsiteOrigins(metadata);
  }

  return readLegacyWebsiteOrigin(metadata);
}
