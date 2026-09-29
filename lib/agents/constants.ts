import { getMimesFromExtensions } from "@/lib/r2/utils/get-mimes-from-extensions";

export const AGENT_CONVERSATION_STARTER_MAX_COUNT = 6;
export const AGENT_CONVERSATION_STARTER_MAX_LENGTH = 120;

export const AGENT_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const AGENT_AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

export const AGENT_AVATAR_UPLOAD_RULES = {
  maxBytes: AGENT_AVATAR_MAX_BYTES,
  allowedMimes: new Set(
    getMimesFromExtensions([".jpg", ".jpeg", ".png", ".webp"]),
  ),
  mimeError: "Unsupported image type. Allowed: JPG, PNG, WebP.",
  sizeError: "Image must be 2 MB or smaller.",
} as const;
