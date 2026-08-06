export const DEFAULT_UPLOAD_SIGNED_URL_RULES = {
  maxBytes: 1024 * 1024 * 5,
  allowedMimes: new Set(["image/*"]),
  mimeError: "Unsupported image type.",
  sizeError: "Image must be 5 MB or smaller.",
} as const;
