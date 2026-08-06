import { getMimesFromExtensions } from "@/lib/r2/utils/get-mimes-from-extensions";

export const CHAT_AGENT_IMAGE_MAX_COUNT = 5;

export const CHAT_AGENT_IMAGE_UPLOAD_RULES = {
  maxBytes: 1024 * 1024 * 15,
  allowedMimes: new Set(
    getMimesFromExtensions([".jpg", ".jpeg", ".png", ".webp", ".gif"]),
  ),
  mimeError: "Unsupported image type. Allowed: JPG, PNG, WebP, GIF.",
  sizeError: "Image must be 15 MB or smaller.",
} as const;

export const CHAT_AGENT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif";
