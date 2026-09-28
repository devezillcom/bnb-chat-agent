import { normalizeWebsiteOrigin } from "./normalize-website-origin";

export function isWebsiteOriginAllowed(params: {
  origin: string;
  allowAllOrigins: boolean;
  allowedOrigins: string[];
}): boolean {
  let normalized: string;

  try {
    normalized = normalizeWebsiteOrigin(params.origin);
  } catch {
    return false;
  }

  if (params.allowAllOrigins) {
    return true;
  }

  return params.allowedOrigins.includes(normalized);
}
