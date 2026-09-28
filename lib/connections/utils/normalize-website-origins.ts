import { WEBSITE_ALLOWED_ORIGINS_MAX } from "../constants";
import { normalizeWebsiteOrigin } from "./normalize-website-origin";

export function normalizeWebsiteOrigins(inputs: string[]): string[] {
  const origins: string[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    const trimmed = input.trim();
    if (!trimmed) {
      continue;
    }

    const origin = normalizeWebsiteOrigin(trimmed);

    if (seen.has(origin)) {
      throw new Error("This domain is already in the list.");
    }

    seen.add(origin);
    origins.push(origin);
  }

  if (origins.length === 0) {
    throw new Error("Add at least one website domain, or allow all websites.");
  }

  if (origins.length > WEBSITE_ALLOWED_ORIGINS_MAX) {
    throw new Error(
      `Add at most ${WEBSITE_ALLOWED_ORIGINS_MAX} website domains.`,
    );
  }

  return origins;
}
